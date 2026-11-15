package com.delivery.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PedidoResponse(
        Long id,
        Long empresaId,
        String nombreComercialEmpresa,
        Long repartidorId,
        String nombreRepartidor,
        String nombreCliente,
        String telefonoCliente,
        String direccionEntrega,
        String referenciaDireccion,
        String descripcion,
        BigDecimal importe,
        String estado,
        LocalDateTime fechaCreacion,
        LocalDateTime fechaActualizacion
) {
}
