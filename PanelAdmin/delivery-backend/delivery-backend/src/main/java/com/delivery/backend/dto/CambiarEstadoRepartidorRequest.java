package com.delivery.backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record CambiarEstadoRepartidorRequest(
        @NotNull(message = "El estado es obligatorio")
        @Pattern(regexp = "DISPONIBLE|OCUPADO|INACTIVO",
                message = "Estado inválido. Use DISPONIBLE, OCUPADO o INACTIVO")
        String estado
) {
}
