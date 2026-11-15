package com.delivery.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record UbicacionResponse(
        Long id,
        Long repartidorId,
        String nombreRepartidor,
        Long pedidoId,
        Long empresaId,
        BigDecimal latitud,
        BigDecimal longitud,
        LocalDateTime fechaRegistro
) {
}
