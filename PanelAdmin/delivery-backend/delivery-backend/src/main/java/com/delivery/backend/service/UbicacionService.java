package com.delivery.backend.service;

import com.delivery.backend.dto.CrearUbicacionRequest;
import com.delivery.backend.dto.UbicacionResponse;
import com.delivery.backend.entity.Empresa;
import com.delivery.backend.entity.EstadoPedido;
import com.delivery.backend.entity.Pedido;
import com.delivery.backend.entity.Repartidor;
import com.delivery.backend.entity.Ubicacion;
import com.delivery.backend.entity.Usuario;
import com.delivery.backend.repository.EmpresaRepository;
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
public class UbicacionService {

    private final UbicacionRepository ubicacionRepository;
    private final PedidoRepository pedidoRepository;
    private final RepartidorRepository repartidorRepository;
    private final EmpresaRepository empresaRepository;
    private final CurrentUser currentUser;

    public UbicacionService(UbicacionRepository ubicacionRepository,
                            PedidoRepository pedidoRepository,
                            RepartidorRepository repartidorRepository,
                            EmpresaRepository empresaRepository,
                            CurrentUser currentUser) {
        this.ubicacionRepository = ubicacionRepository;
        this.pedidoRepository = pedidoRepository;
        this.repartidorRepository = repartidorRepository;
        this.empresaRepository = empresaRepository;
        this.currentUser = currentUser;
    }

    @Transactional
    public UbicacionResponse crear(CrearUbicacionRequest request) {
        validarCoordenadas(request.latitud(), request.longitud());

        Pedido pedido = pedidoRepository.findByIdConEmpresaYRepartidor(request.pedidoId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Pedido no encontrado"));

        if (!currentUser.esAdmin()) {
            Long empresaId = empresaPropiaId();
            if (!pedido.getEmpresa().getId().equals(empresaId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "No tienes permisos para registrar ubicaciones en este pedido");
            }
        }

        if (pedido.getEstado() == EstadoPedido.ENTREGADO
                || pedido.getEstado() == EstadoPedido.CANCELADO
                || pedido.getEstado() == EstadoPedido.RECHAZADO) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "No se puede registrar seguimiento en un pedido finalizado");
        }

        Repartidor repartidor = repartidorRepository
                .findByIdConEmpresa(request.repartidorId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Repartidor no encontrado"));

        if (!repartidor.getEmpresa().getId().equals(pedido.getEmpresa().getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "El repartidor no pertenece a la empresa del pedido");
        }

        if (repartidor.getEstado() != null
                && "INACTIVO".equals(repartidor.getEstado().name())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "No se puede registrar seguimiento de un repartidor inactivo");
        }

        if (pedido.getRepartidor() == null
                || !pedido.getRepartidor().getId().equals(repartidor.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "El repartidor no está asignado a este pedido");
        }

        Ubicacion ubicacion = new Ubicacion();
        ubicacion.setRepartidor(repartidor);
        ubicacion.setPedido(pedido);
        ubicacion.setLatitud(request.latitud());
        ubicacion.setLongitud(request.longitud());
        ubicacion.setFechaRegistro(LocalDateTime.now());

        ubicacion = ubicacionRepository.save(ubicacion);
        return toResponse(ubicacion);
    }

    @Transactional(readOnly = true)
    public List<UbicacionResponse> listar() {
        if (currentUser.esAdmin()) {
            return ubicacionRepository.findAllConRelaciones().stream()
                    .map(this::toResponse)
                    .toList();
        }

        Long empresaId = empresaPropiaId();
        return ubicacionRepository.findByEmpresaIdConRelaciones(empresaId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<UbicacionResponse> listarPorPedido(Long pedidoId) {
        Pedido pedido = cargarPedidoConPermisos(pedidoId);
        return ubicacionRepository.findByPedidoIdConRelaciones(pedido.getId()).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<UbicacionResponse> listarPorRepartidorYPedido(
            Long repartidorId, Long pedidoId) {
        cargarPedidoConPermisos(pedidoId);

        return ubicacionRepository
                .findByRepartidorIdAndPedidoId(repartidorId, pedidoId).stream()
                .map(this::toResponse)
                .toList();
    }

    private void validarCoordenadas(BigDecimal latitud, BigDecimal longitud) {
        if (latitud.compareTo(new BigDecimal("-90")) < 0
                || latitud.compareTo(new BigDecimal("90")) > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "La latitud debe estar entre -90 y 90");
        }
        if (longitud.compareTo(new BigDecimal("-180")) < 0
                || longitud.compareTo(new BigDecimal("180")) > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "La longitud debe estar entre -180 y 180");
        }
    }

    private Pedido cargarPedidoConPermisos(Long pedidoId) {
        Pedido pedido = pedidoRepository.findByIdConEmpresaYRepartidor(pedidoId)
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

    private Long empresaPropiaId() {
        Usuario actual = currentUser.get();
        return empresaRepository.findByUsuarioId(actual.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Empresa no encontrada"))
                .getId();
    }

    private UbicacionResponse toResponse(Ubicacion ubicacion) {
        Repartidor repartidor = ubicacion.getRepartidor();
        Pedido pedido = ubicacion.getPedido();
        Empresa empresa = pedido.getEmpresa();
        return new UbicacionResponse(
                ubicacion.getId(),
                repartidor != null ? repartidor.getId() : null,
                repartidor != null ? repartidor.getNombre() : null,
                pedido != null ? pedido.getId() : null,
                empresa != null ? empresa.getId() : null,
                ubicacion.getLatitud(),
                ubicacion.getLongitud(),
                ubicacion.getFechaRegistro()
        );
    }
}
