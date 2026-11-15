package com.delivery.backend.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record CrearUbicacionRequest(
        @NotNull(message = "El repartidor es obligatorio")
        Long repartidorId,

        @NotNull(message = "El pedido es obligatorio")
        Long pedidoId,

        @NotNull(message = "La latitud es obligatoria")
        @DecimalMin(value = "-90", message = "La latitud debe estar entre -90 y 90")
        @DecimalMax(value = "90", message = "La latitud debe estar entre -90 y 90")
        BigDecimal latitud,

        @NotNull(message = "La longitud es obligatoria")
        @DecimalMin(value = "-180", message = "La longitud debe estar entre -180 y 180")
        @DecimalMax(value = "180", message = "La longitud debe estar entre -180 y 180")
        BigDecimal longitud
) {
}
