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
import com.delivery.backend.entity.Usuario;
import com.delivery.backend.repository.EmpresaRepository;
import com.delivery.backend.repository.PedidoHistorialRepository;
import com.delivery.backend.repository.PedidoRepository;
import com.delivery.backend.repository.RepartidorRepository;
import com.delivery.backend.security.CurrentUser;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

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
    private final CurrentUser currentUser;

    public PedidoService(PedidoRepository pedidoRepository,
                         PedidoHistorialRepository historialRepository,
                         EmpresaRepository empresaRepository,
                         RepartidorRepository repartidorRepository,
                         CurrentUser currentUser) {
        this.pedidoRepository = pedidoRepository;
        this.historialRepository = historialRepository;
        this.empresaRepository = empresaRepository;
        this.repartidorRepository = repartidorRepository;
        this.currentUser = currentUser;
    }

    @Transactional(readOnly = true)
    public List<PedidoResponse> listar() {
        if (currentUser.esAdmin()) {
            return pedidoRepository.findAllConEmpresaYRepartidor().stream()
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
        return transicionar(id, EstadoPedido.ACEPTADO, observacion);
    }

    @Transactional
    public PedidoResponse rechazar(Long id, String observacion) {
        return transicionar(id, EstadoPedido.RECHAZADO, observacion);
    }

    @Transactional
    public PedidoResponse cambiarEstado(Long id, CambiarEstadoPedidoRequest request) {
        EstadoPedido destino;
        try {
            destino = EstadoPedido.valueOf(request.estado());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Estado inválido");
        }

        return transicionar(id, destino, request.observacion());
    }

    @Transactional(readOnly = true)
    public List<PedidoHistorialResponse> listarHistorial(Long pedidoId) {
        cargarConPermisos(pedidoId);
        return historialRepository.findByPedidoIdConUsuario(pedidoId).stream()
                .map(this::toHistorialResponse)
                .toList();
    }

    private PedidoResponse transicionar(Long id, EstadoPedido destino, String observacion) {
        Pedido pedido = cargarConPermisos(id);
        EstadoPedido actual = pedido.getEstado();

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

        registrarHistorial(pedido, actual, destino, observacion);

        if (destino == EstadoPedido.ENTREGADO
                || destino == EstadoPedido.CANCELADO
                || destino == EstadoPedido.RECHAZADO) {
            liberarRepartidorSiEsOcupado(pedido);
        }

        return toResponse(pedido);
    }

    private void registrarHistorial(Pedido pedido, EstadoPedido anterior,
                                    EstadoPedido nuevo, String observacion) {
        PedidoHistorial historial = new PedidoHistorial();
        historial.setPedido(pedido);
        historial.setEstadoAnterior(anterior);
        historial.setEstadoNuevo(nuevo);
        historial.setUsuario(currentUser.get());
        historial.setFecha(LocalDateTime.now());
        historial.setObservacion(observacion);
        historialRepository.save(historial);
    }

    private void liberarRepartidorSiEsOcupado(Pedido pedido) {
        Repartidor repartidor = pedido.getRepartidor();
        if (repartidor != null
                && repartidor.getEstado() != null
                && repartidor.getEstado().name().equals("OCUPADO")) {
            repartidor.setEstado(EstadoRepartidor.DISPONIBLE);
            repartidorRepository.save(repartidor);
        }
    }

    private Pedido cargarConPermisos(Long id) {
        Pedido pedido = pedidoRepository.findByIdConEmpresaYRepartidor(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Pedido no encontrado"));

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

    private PedidoResponse toResponse(Pedido pedido) {
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
                pedido.getFechaActualizacion()
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
