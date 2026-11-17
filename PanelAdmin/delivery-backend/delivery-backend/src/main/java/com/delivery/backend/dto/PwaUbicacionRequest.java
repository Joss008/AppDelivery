package com.delivery.backend.dto;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record PwaUbicacionRequest(
        @NotNull(message = "La latitud es obligatoria")
        BigDecimal latitud,

        @NotNull(message = "La longitud es obligatoria")
        BigDecimal longitud,

        Long pedidoId
) {
}
