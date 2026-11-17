package com.delivery.backend.service;

import com.delivery.backend.dto.ActualizarRepartidorRequest;
import com.delivery.backend.dto.CambiarEstadoRepartidorRequest;
import com.delivery.backend.dto.CrearRepartidorRequest;
import com.delivery.backend.dto.RepartidorResponse;
import com.delivery.backend.entity.Empresa;
import com.delivery.backend.entity.EstadoRepartidor;
import com.delivery.backend.entity.Repartidor;
import com.delivery.backend.entity.Usuario;
import com.delivery.backend.repository.EmpresaRepository;
import com.delivery.backend.repository.RepartidorRepository;
import com.delivery.backend.security.CurrentUser;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class RepartidorService {

    private final RepartidorRepository repartidorRepository;
    private final EmpresaRepository empresaRepository;
    private final PasswordEncoder passwordEncoder;
    private final CurrentUser currentUser;

    public RepartidorService(RepartidorRepository repartidorRepository,
                             EmpresaRepository empresaRepository,
                             PasswordEncoder passwordEncoder,
                             CurrentUser currentUser) {
        this.repartidorRepository = repartidorRepository;
        this.empresaRepository = empresaRepository;
        this.passwordEncoder = passwordEncoder;
        this.currentUser = currentUser;
    }

    @Transactional(readOnly = true)
    public List<RepartidorResponse> listar() {
        if (currentUser.esAdmin()) {
            return repartidorRepository.findAllConEmpresa().stream()
                    .map(this::toResponse)
                    .toList();
        }

        if (currentUser.esRepartidor()) {
            Repartidor actual = currentUser.getRepartidor();
            return List.of(toResponse(actual));
        }

        Long empresaId = empresaPropiaId();
        return repartidorRepository.findByEmpresaId(empresaId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public RepartidorResponse obtenerPorId(Long id) {
        Repartidor repartidor = cargarConPermisos(id);
        return toResponse(repartidor);
    }

    @Transactional
    public RepartidorResponse crear(CrearRepartidorRequest request) {
        Empresa empresa = resolverEmpresaParaCrear(request.empresaId());

        if (repartidorRepository.existsByEmpresaIdAndDni(empresa.getId(), request.dni())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Ya existe un repartidor con ese DNI en la empresa");
        }

        String rawPassword = (request.password() != null && !request.password().isBlank())
                ? request.password().trim()
                : request.dni().trim();

        Repartidor repartidor = new Repartidor();
        repartidor.setEmpresa(empresa);
        repartidor.setNombre(request.nombre().trim());
        repartidor.setDni(request.dni().trim());
        repartidor.setTelefono(request.telefono() != null ? request.telefono().trim() : null);
        repartidor.setPasswordHash(passwordEncoder.encode(rawPassword));
        repartidor.setEstado(EstadoRepartidor.DISPONIBLE);
        repartidor.setGpsActivo(false);
        repartidor.setFechaRegistro(LocalDateTime.now());

        repartidor = repartidorRepository.save(repartidor);
        return toResponse(repartidor);
    }

    @Transactional
    public RepartidorResponse actualizar(Long id, ActualizarRepartidorRequest request) {
        Repartidor repartidor = cargarConPermisos(id);
        Empresa empresa = repartidor.getEmpresa();

        if (repartidorRepository.existsByEmpresaIdAndDniAndIdNot(
                empresa.getId(), request.dni(), id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Ya existe un repartidor con ese DNI en la empresa");
        }

        repartidor.setNombre(request.nombre().trim());
        repartidor.setDni(request.dni().trim());
        repartidor.setTelefono(request.telefono() != null ? request.telefono().trim() : null);

        if (request.password() != null && !request.password().isBlank()) {
            repartidor.setPasswordHash(passwordEncoder.encode(request.password().trim()));
        }

        repartidor = repartidorRepository.save(repartidor);
        return toResponse(repartidor);
    }

    @Transactional
    public RepartidorResponse cambiarEstado(Long id, CambiarEstadoRepartidorRequest request) {
        Repartidor repartidor = cargarConPermisos(id);

        EstadoRepartidor estado;
        try {
            estado = EstadoRepartidor.valueOf(request.estado());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Estado inválido");
        }

        repartidor.setEstado(estado);
        repartidor = repartidorRepository.save(repartidor);
        return toResponse(repartidor);
    }

    @Transactional
    public void eliminar(Long id) {
        Repartidor repartidor = cargarConPermisos(id);
        repartidor.setEstado(EstadoRepartidor.INACTIVO);
        repartidor.setGpsActivo(false);
        repartidorRepository.save(repartidor);
    }

    private Repartidor cargarConPermisos(Long id) {
        Repartidor repartidor = repartidorRepository.findByIdConEmpresa(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Repartidor no encontrado"));

        if (currentUser.esRepartidor()) {
            Repartidor actual = currentUser.getRepartidor();
            if (!repartidor.getId().equals(actual.getId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "No tienes permisos para acceder a otro repartidor");
            }
            return repartidor;
        }

        if (!currentUser.esAdmin()) {
            Long empresaId = empresaPropiaId();
            if (!repartidor.getEmpresa().getId().equals(empresaId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "No tienes permisos para acceder a este repartidor");
            }
        }

        return repartidor;
    }

    private Empresa resolverEmpresaParaCrear(Long empresaId) {
        Empresa empresa = empresaRepository.findById(empresaId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Empresa no encontrada"));

        if (!currentUser.esAdmin()) {
            Long propia = empresaPropiaId();
            if (!empresa.getId().equals(propia)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Solo puedes crear repartidores en tu empresa");
            }
        }

        return empresa;
    }

    private Long empresaPropiaId() {
        Usuario actual = currentUser.get();
        return empresaRepository.findByUsuarioId(actual.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Empresa no encontrada"))
                .getId();
    }

    public RepartidorResponse toResponse(Repartidor repartidor) {
        Empresa empresa = repartidor.getEmpresa();
        return new RepartidorResponse(
                repartidor.getId(),
                empresa != null ? empresa.getId() : null,
                empresa != null ? empresa.getNombreComercial() : null,
                repartidor.getNombre(),
                repartidor.getDni(),
                repartidor.getTelefono(),
                repartidor.getEstado().name(),
                repartidor.getFechaRegistro(),
                repartidor.getUltimaLatitud(),
                repartidor.getUltimaLongitud(),
                repartidor.getUltimaUbicacionFecha(),
                Boolean.TRUE.equals(repartidor.getGpsActivo())
        );
    }
}
