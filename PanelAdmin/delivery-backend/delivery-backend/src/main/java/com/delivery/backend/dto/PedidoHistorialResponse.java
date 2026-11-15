package com.delivery.backend.dto;

import java.time.LocalDateTime;

public record PedidoHistorialResponse(
        Long id,
        Long pedidoId,
        String estadoAnterior,
        String estadoNuevo,
        Long usuarioId,
        String nombreUsuario,
        LocalDateTime fecha,
        String observacion
) {
}
