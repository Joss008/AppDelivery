package com.delivery.backend.service;

import com.delivery.backend.dto.ActualizarPedidoRequest;
import com.delivery.backend.dto.CambiarEstadoPedidoRequest;
import com.delivery.backend.dto.CrearPedidoRequest;
import com.delivery.backend.dto.PedidoHistorialResponse;
import com.delivery.backend.dto.PedidoResponse;
import com.delivery.backend.entity.Empresa;
import com.delivery.backend.entity.EstadoPedido;
import com.delivery.backend.entity.EstadoRepartidor;
import com.delivery.backend.entity.Pedido;
import com.delivery.backend.entity.PedidoHistorial;
import com.delivery.backend.entity.Repartidor;
import com.delivery.backend.entity.Ubicacion;
import com.delivery.backend.entity.Usuario;
import com.delivery.backend.repository.EmpresaRepository;
import com.delivery.backend.repository.PedidoHistorialRepository;
import com.delivery.backend.repository.PedidoRepository;
import com.delivery.backend.repository.RepartidorRepository;
import com.delivery.backend.repository.UbicacionRepository;
import com.delivery.backend.security.CurrentUser;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class PedidoService {

    private static final String TRANSICION_INVALIDA =
            "Transición de estado no permitida";

    private final PedidoRepository pedidoRepository;
    private final PedidoHistorialRepository historialRepository;
    private final EmpresaRepository empresaRepository;
    private final RepartidorRepository repartidorRepository;
    private final UbicacionRepository ubicacionRepository;
    private final CurrentUser currentUser;

    public PedidoService(PedidoRepository pedidoRepository,
                         PedidoHistorialRepository historialRepository,
                         EmpresaRepository empresaRepository,
                         RepartidorRepository repartidorRepository,
                         UbicacionRepository ubicacionRepository,
                         CurrentUser currentUser) {
        this.pedidoRepository = pedidoRepository;
        this.historialRepository = historialRepository;
        this.empresaRepository = empresaRepository;
        this.repartidorRepository = repartidorRepository;
        this.ubicacionRepository = ubicacionRepository;
        this.currentUser = currentUser;
    }

    @Transactional(readOnly = true)
    public List<PedidoResponse> listar() {
        if (currentUser.esAdmin()) {
            return pedidoRepository.findAllConEmpresaYRepartidor().stream()
                    .map(this::toResponse)
                    .toList();
        }

        if (currentUser.esRepartidor()) {
            Repartidor repartidor = currentUser.getRepartidor();
            return pedidoRepository.findVisiblesParaRepartidor(
                            repartidor.getEmpresa().getId(),
                            repartidor.getId())
                    .stream()
                    .map(this::toResponse)
                    .toList();
        }

        Long empresaId = empresaPropiaId();
        return pedidoRepository.findByEmpresaIdConRepartidor(empresaId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PedidoResponse obtenerPorId(Long id) {
        return toResponse(cargarConPermisos(id));
    }

    @Transactional
    public PedidoResponse crear(CrearPedidoRequest request) {
        if (currentUser.esRepartidor()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Un repartidor no puede crear pedidos");
        }

        Empresa empresa = resolverEmpresaParaCrear(request.empresaId());
        Repartidor repartidor = resolverRepartidorOpcional(
                request.repartidorId(), empresa.getId());

        Pedido pedido = new Pedido();
        pedido.setEmpresa(empresa);
        pedido.setRepartidor(repartidor);
        pedido.setNombreCliente(request.nombreCliente());
        pedido.setTelefonoCliente(request.telefonoCliente());
        pedido.setDireccionEntrega(request.direccionEntrega());
        pedido.setReferenciaDireccion(request.referenciaDireccion());
        pedido.setDescripcion(request.descripcion());
        pedido.setImporte(request.importe());
        pedido.setEstado(EstadoPedido.PENDIENTE);
        pedido.setFechaCreacion(LocalDateTime.now());

        pedido = pedidoRepository.save(pedido);
        registrarHistorial(pedido, null, EstadoPedido.PENDIENTE, "Pedido creado");

        return toResponse(pedido);
    }

    @Transactional
    public PedidoResponse actualizar(Long id, ActualizarPedidoRequest request) {
        if (currentUser.esRepartidor()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Un repartidor no puede editar los datos del pedido");
        }

        Pedido pedido = cargarConPermisos(id);

        if (pedido.getEstado().esFinal()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "No se puede editar un pedido en estado final");
        }

        Repartidor repartidor = resolverRepartidorOpcional(
                request.repartidorId(), pedido.getEmpresa().getId());

        pedido.setRepartidor(repartidor);
        pedido.setNombreCliente(request.nombreCliente());
        pedido.setTelefonoCliente(request.telefonoCliente());
        pedido.setDireccionEntrega(request.direccionEntrega());
        pedido.setReferenciaDireccion(request.referenciaDireccion());
        pedido.setDescripcion(request.descripcion());
        pedido.setImporte(request.importe());
        pedido.setFechaActualizacion(LocalDateTime.now());

        pedido = pedidoRepository.save(pedido);
        return toResponse(pedido);
    }

    @Transactional
    public PedidoResponse aceptar(Long id, String observacion) {
        if (currentUser.esRepartidor()) {
            return aceptarPorRepartidor(id, observacion);
        }
        return transicionar(id, EstadoPedido.ACEPTADO, observacion, null, null);
    }

    @Transactional
    public PedidoResponse rechazar(Long id, String observacion) {
        if (currentUser.esRepartidor()) {
            return rechazarPorRepartidor(id, observacion);
        }
        return transicionar(id, EstadoPedido.RECHAZADO, observacion, null, null);
    }

    @Transactional
    public PedidoResponse cambiarEstado(Long id, CambiarEstadoPedidoRequest request) {
        EstadoPedido destino;
        try {
            destino = EstadoPedido.valueOf(request.estado());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Estado inválido");
        }

        return transicionar(
                id,
                destino,
                request.observacion(),
                request.latitud(),
                request.longitud()
        );
    }

    @Transactional(readOnly = true)
    public List<PedidoHistorialResponse> listarHistorial(Long pedidoId) {
        cargarConPermisos(pedidoId);
        return historialRepository.findByPedidoIdConUsuario(pedidoId).stream()
                .map(this::toHistorialResponse)
                .toList();
    }

    private PedidoResponse aceptarPorRepartidor(Long id, String observacion) {
        Repartidor repartidor = currentUser.getRepartidor();
        Pedido pedido = cargarConPermisos(id);

        if (pedido.getEstado().esFinal()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "El pedido ya se encuentra finalizado");
        }

        if (pedido.getRepartidor() != null
                && !pedido.getRepartidor().getId().equals(repartidor.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Este pedido ya fue tomado por otro repartidor");
        }

        EstadoPedido anterior = pedido.getEstado();
        EstadoPedido nuevoEstado = (anterior == EstadoPedido.PENDIENTE)
                ? EstadoPedido.ACEPTADO
                : anterior;

        pedido.setRepartidor(repartidor);
        pedido.setEstado(nuevoEstado);
        pedido.setFechaActualizacion(LocalDateTime.now());
        pedido = pedidoRepository.save(pedido);

        repartidor.setEstado(EstadoRepartidor.OCUPADO);
        repartidorRepository.save(repartidor);

        String nota = (observacion != null && !observacion.isBlank())
                ? observacion.trim()
                : "Pedido aceptado desde PWA por repartidor " + repartidor.getNombre();
        registrarHistorial(pedido, anterior, nuevoEstado, nota);

        return toResponse(pedido);
    }

    private PedidoResponse rechazarPorRepartidor(Long id, String observacion) {
        Repartidor repartidor = currentUser.getRepartidor();
        Pedido pedido = cargarConPermisos(id);

        if (pedido.getEstado().esFinal()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "El pedido ya se encuentra finalizado");
        }

        if (pedido.getRepartidor() != null
                && !pedido.getRepartidor().getId().equals(repartidor.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "No puedes rechazar un pedido asignado a otro repartidor");
        }

        EstadoPedido anterior = pedido.getEstado();
        pedido.setRepartidor(null);
        EstadoPedido nuevoEstado = EstadoPedido.PENDIENTE;
        pedido.setEstado(nuevoEstado);
        pedido.setFechaActualizacion(LocalDateTime.now());
        pedido = pedidoRepository.save(pedido);

        actualizarEstadoOcupacionRepartidor(repartidor);

        String nota = (observacion != null && !observacion.isBlank())
                ? observacion.trim()
                : "Liberado/rechazado desde PWA por repartidor " + repartidor.getNombre();
        registrarHistorial(pedido, anterior, nuevoEstado, nota);

        return toResponse(pedido);
    }

    private PedidoResponse transicionar(
            Long id,
            EstadoPedido destino,
            String observacion,
            BigDecimal latitud,
            BigDecimal longitud) {
        Pedido pedido = cargarConPermisos(id);
        EstadoPedido actual = pedido.getEstado();

        if (currentUser.esRepartidor()) {
            Repartidor rep = currentUser.getRepartidor();
            if (pedido.getRepartidor() == null
                    || !pedido.getRepartidor().getId().equals(rep.getId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Debes aceptar el pedido antes de actualizar su estado");
            }
        }

        if (actual == destino) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "El pedido ya está en ese estado");
        }

        if (!actual.puedeTransicionarA(destino)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    TRANSICION_INVALIDA + ": " + actual.name() + " -> " + destino.name());
        }

        if (destino == EstadoPedido.EN_CAMINO && pedido.getRepartidor() == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Se debe asignar un repartidor antes de enviar en camino");
        }

        pedido.setEstado(destino);
        pedido.setFechaActualizacion(LocalDateTime.now());
        pedido = pedidoRepository.save(pedido);

        if (pedido.getRepartidor() != null && destino == EstadoPedido.EN_CAMINO) {
            Repartidor rep = pedido.getRepartidor();
            if (rep.getEstado() == EstadoRepartidor.DISPONIBLE) {
                rep.setEstado(EstadoRepartidor.OCUPADO);
                repartidorRepository.save(rep);
            }
        }

        if (latitud != null && longitud != null && pedido.getRepartidor() != null) {
            registrarUbicacionEvidencia(pedido, pedido.getRepartidor(), latitud, longitud);
        }

        registrarHistorial(pedido, actual, destino, observacion);

        if (destino == EstadoPedido.ENTREGADO
                || destino == EstadoPedido.CANCELADO
                || destino == EstadoPedido.RECHAZADO) {
            if (pedido.getRepartidor() != null) {
                actualizarEstadoOcupacionRepartidor(pedido.getRepartidor());
            }
        }

        return toResponse(pedido);
    }

    private void registrarUbicacionEvidencia(
            Pedido pedido,
            Repartidor repartidor,
            BigDecimal latitud,
            BigDecimal longitud) {
        if (latitud.compareTo(new BigDecimal("-90")) < 0
                || latitud.compareTo(new BigDecimal("90")) > 0
                || longitud.compareTo(new BigDecimal("-180")) < 0
                || longitud.compareTo(new BigDecimal("180")) > 0) {
            return;
        }

        LocalDateTime ahora = LocalDateTime.now();
        Ubicacion ubicacion = new Ubicacion();
        ubicacion.setPedido(pedido);
        ubicacion.setRepartidor(repartidor);
        ubicacion.setLatitud(latitud);
        ubicacion.setLongitud(longitud);
        ubicacion.setFechaRegistro(ahora);
        ubicacionRepository.save(ubicacion);

        repartidor.setUltimaLatitud(latitud);
        repartidor.setUltimaLongitud(longitud);
        repartidor.setUltimaUbicacionFecha(ahora);
        repartidor.setGpsActivo(true);
        repartidorRepository.save(repartidor);
    }

    private void registrarHistorial(Pedido pedido, EstadoPedido anterior,
                                    EstadoPedido nuevo, String observacion) {
        PedidoHistorial historial = new PedidoHistorial();
        historial.setPedido(pedido);
        historial.setEstadoAnterior(anterior);
        historial.setEstadoNuevo(nuevo);

        if (currentUser.esRepartidor()) {
            Repartidor rep = currentUser.getRepartidor();
            Usuario usuarioEmpresa = pedido.getEmpresa().getUsuario();
            historial.setUsuario(usuarioEmpresa);
            String baseObs = (observacion != null && !observacion.isBlank())
                    ? observacion.trim()
                    : "Actualizado desde PWA";
            historial.setObservacion(baseObs + " (Repartidor: " + rep.getNombre() + ")");
        } else {
            historial.setUsuario(currentUser.get());
            historial.setObservacion(observacion);
        }

        historial.setFecha(LocalDateTime.now());
        historialRepository.save(historial);
    }

    private void actualizarEstadoOcupacionRepartidor(Repartidor repartidor) {
        List<Pedido> activos = pedidoRepository.findActivosPorRepartidor(repartidor.getId());
        if (activos.isEmpty()) {
            if (repartidor.getEstado() == EstadoRepartidor.OCUPADO) {
                repartidor.setEstado(EstadoRepartidor.DISPONIBLE);
                repartidorRepository.save(repartidor);
            }
        } else {
            if (repartidor.getEstado() == EstadoRepartidor.DISPONIBLE) {
                repartidor.setEstado(EstadoRepartidor.OCUPADO);
                repartidorRepository.save(repartidor);
            }
        }
    }

    private Pedido cargarConPermisos(Long id) {
        Pedido pedido = pedidoRepository.findByIdConEmpresaYRepartidor(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Pedido no encontrado"));

        if (currentUser.esRepartidor()) {
            Repartidor repartidor = currentUser.getRepartidor();
            if (!pedido.getEmpresa().getId().equals(repartidor.getEmpresa().getId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "No tienes permisos para acceder a este pedido");
            }
            if (pedido.getRepartidor() != null
                    && !pedido.getRepartidor().getId().equals(repartidor.getId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Este pedido está asignado a otro repartidor");
            }
            return pedido;
        }

        if (!currentUser.esAdmin()) {
            Long empresaId = empresaPropiaId();
            if (!pedido.getEmpresa().getId().equals(empresaId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "No tienes permisos para acceder a este pedido");
            }
        }

        return pedido;
    }

    private Empresa resolverEmpresaParaCrear(Long empresaId) {
        Empresa empresa = empresaRepository.findById(empresaId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Empresa no encontrada"));

        if (!currentUser.esAdmin()) {
            Long propia = empresaPropiaId();
            if (!empresa.getId().equals(propia)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Solo puedes crear pedidos en tu empresa");
            }
        }

        return empresa;
    }

    private Repartidor resolverRepartidorOpcional(Long repartidorId, Long empresaId) {
        if (repartidorId == null) {
            return null;
        }

        Repartidor repartidor = repartidorRepository.findById(repartidorId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Repartidor no encontrado"));

        if (!repartidor.getEmpresa().getId().equals(empresaId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "No se puede asignar un repartidor de otra empresa");
        }

        if (repartidor.getEstado() != null
                && "INACTIVO".equals(repartidor.getEstado().name())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "No se puede asignar un repartidor inactivo");
        }

        return repartidor;
    }

    private Long empresaPropiaId() {
        Usuario actual = currentUser.get();
        return empresaRepository.findByUsuarioId(actual.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Empresa no encontrada"))
                .getId();
    }

    public PedidoResponse toResponse(Pedido pedido) {
        Empresa empresa = pedido.getEmpresa();
        Repartidor repartidor = pedido.getRepartidor();
        return new PedidoResponse(
                pedido.getId(),
                empresa != null ? empresa.getId() : null,
                empresa != null ? empresa.getNombreComercial() : null,
                repartidor != null ? repartidor.getId() : null,
                repartidor != null ? repartidor.getNombre() : null,
                pedido.getNombreCliente(),
                pedido.getTelefonoCliente(),
                pedido.getDireccionEntrega(),
                pedido.getReferenciaDireccion(),
                pedido.getDescripcion(),
                pedido.getImporte(),
                pedido.getEstado().name(),
                pedido.getFechaCreacion(),
                pedido.getFechaActualizacion(),
                empresa != null ? empresa.getDireccion() : null,
                empresa != null ? empresa.getTelefono() : null
        );
    }

    private PedidoHistorialResponse toHistorialResponse(PedidoHistorial historial) {
        Usuario usuario = historial.getUsuario();
        return new PedidoHistorialResponse(
                historial.getId(),
                historial.getPedido().getId(),
                historial.getEstadoAnterior() != null
                        ? historial.getEstadoAnterior().name() : null,
                historial.getEstadoNuevo().name(),
                usuario != null ? usuario.getId() : null,
                usuario != null ? usuario.getNombre() : null,
                historial.getFecha(),
                historial.getObservacion()
        );
    }
}
