package com.delivery.backend.service;

import com.delivery.backend.dto.PwaUbicacionRequest;
import com.delivery.backend.dto.RepartidorLoginRequest;
import com.delivery.backend.dto.RepartidorLoginResponse;
import com.delivery.backend.dto.RepartidorResponse;
import com.delivery.backend.entity.EstadoRepartidor;
import com.delivery.backend.entity.Pedido;
import com.delivery.backend.entity.Repartidor;
import com.delivery.backend.entity.Ubicacion;
import com.delivery.backend.repository.PedidoRepository;
import com.delivery.backend.repository.RepartidorRepository;
import com.delivery.backend.repository.UbicacionRepository;
import com.delivery.backend.security.CurrentUser;
import com.delivery.backend.security.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class PwaService {

    private final RepartidorRepository repartidorRepository;
    private final PedidoRepository pedidoRepository;
    private final UbicacionRepository ubicacionRepository;
    private final RepartidorService repartidorService;
    private final UbicacionService ubicacionService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final CurrentUser currentUser;

    public PwaService(RepartidorRepository repartidorRepository,
                      PedidoRepository pedidoRepository,
                      UbicacionRepository ubicacionRepository,
                      RepartidorService repartidorService,
                      UbicacionService ubicacionService,
                      PasswordEncoder passwordEncoder,
                      JwtService jwtService,
                      CurrentUser currentUser) {
        this.repartidorRepository = repartidorRepository;
        this.pedidoRepository = pedidoRepository;
        this.ubicacionRepository = ubicacionRepository;
        this.repartidorService = repartidorService;
        this.ubicacionService = ubicacionService;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.currentUser = currentUser;
    }

    @Transactional
    public RepartidorLoginResponse login(RepartidorLoginRequest request) {
        String identificador = request.identificador().trim();
        String password = request.password();

        List<Repartidor> candidatos = repartidorRepository
                .findByIdentificadorConEmpresa(identificador);

        if (candidatos.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Credenciales inválidas"
            );
        }

        Repartidor autenticado = null;
        for (Repartidor rep : candidatos) {
            if (verificarPassword(rep, password)) {
                autenticado = rep;
                break;
            }
        }

        if (autenticado == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Credenciales inválidas"
            );
        }

        if (autenticado.getEstado() == EstadoRepartidor.INACTIVO) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Tu cuenta de repartidor se encuentra inactiva"
            );
        }

        if (autenticado.getEmpresa() != null
                && !Boolean.TRUE.equals(autenticado.getEmpresa().getActivo())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "La empresa asociada se encuentra inactiva"
            );
        }

        String token = jwtService.generarTokenRepartidor(autenticado);
        return new RepartidorLoginResponse(
                token,
                "Bearer",
                repartidorService.toResponse(autenticado)
        );
    }

    @Transactional(readOnly = true)
    public RepartidorResponse obtenerRepartidorActual() {
        Repartidor repartidor = currentUser.getRepartidor();
        Repartidor recargado = repartidorRepository
                .findByIdConEmpresa(repartidor.getId())
                .orElse(repartidor);
        return repartidorService.toResponse(recargado);
    }

    @Transactional
    public void logout() {
        if (currentUser.esRepartidor()) {
            Repartidor repartidor = currentUser.getRepartidor();
            Repartidor entidad = repartidorRepository
                    .findByIdConEmpresa(repartidor.getId())
                    .orElse(repartidor);
            entidad.setGpsActivo(false);
            repartidorRepository.save(entidad);
        }
    }

    @Transactional
    public RepartidorResponse registrarUbicacionPwa(PwaUbicacionRequest request) {
        ubicacionService.validarCoordenadas(request.latitud(), request.longitud());

        Repartidor actual = currentUser.getRepartidor();
        Repartidor repartidor = repartidorRepository
                .findByIdConEmpresa(actual.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Repartidor no encontrado"));

        LocalDateTime ahora = LocalDateTime.now();
        repartidor.setUltimaLatitud(request.latitud());
        repartidor.setUltimaLongitud(request.longitud());
        repartidor.setUltimaUbicacionFecha(ahora);
        repartidor.setGpsActivo(true);
        repartidor = repartidorRepository.save(repartidor);

        // Si el repartidor tiene pedidos activos en curso (o indicó un pedidoId),
        // registramos la coordenada también en la tabla `ubicaciones` para que el
        // panel de seguimiento de la empresa dibuje el recorrido en tiempo real.
        List<Pedido> activos = pedidoRepository.findActivosPorRepartidor(repartidor.getId());
        if (request.pedidoId() != null) {
            Pedido especifico = activos.stream()
                    .filter(p -> p.getId().equals(request.pedidoId()))
                    .findFirst()
                    .orElse(null);
            if (especifico != null) {
                guardarPuntoUbicacion(repartidor, especifico, request, ahora);
            } else {
                for (Pedido p : activos) {
                    guardarPuntoUbicacion(repartidor, p, request, ahora);
                }
            }
        } else {
            for (Pedido p : activos) {
                guardarPuntoUbicacion(repartidor, p, request, ahora);
            }
        }

        return repartidorService.toResponse(repartidor);
    }

    @Transactional
    public RepartidorResponse pausarUbicacionPwa() {
        Repartidor actual = currentUser.getRepartidor();
        Repartidor repartidor = repartidorRepository
                .findByIdConEmpresa(actual.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Repartidor no encontrado"));

        repartidor.setGpsActivo(false);
        repartidor = repartidorRepository.save(repartidor);
        return repartidorService.toResponse(repartidor);
    }

    private void guardarPuntoUbicacion(
            Repartidor repartidor,
            Pedido pedido,
            PwaUbicacionRequest request,
            LocalDateTime fecha) {
        Ubicacion u = new Ubicacion();
        u.setRepartidor(repartidor);
        u.setPedido(pedido);
        u.setLatitud(request.latitud());
        u.setLongitud(request.longitud());
        u.setFechaRegistro(fecha);
        ubicacionRepository.save(u);
    }

    private boolean verificarPassword(Repartidor repartidor, String rawPassword) {
        String hash = repartidor.getPasswordHash();
        if (hash != null && !hash.isBlank()) {
            return passwordEncoder.matches(rawPassword, hash);
        }
        // Si fue creado antes de V5 sin passwordHash, su contraseña inicial es su DNI
        if (repartidor.getDni() != null && repartidor.getDni().equals(rawPassword.trim())) {
            repartidor.setPasswordHash(passwordEncoder.encode(rawPassword.trim()));
            repartidorRepository.save(repartidor);
            return true;
        }
        return false;
    }
}
