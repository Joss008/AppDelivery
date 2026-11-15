package com.delivery.backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CambiarEstadoPedidoRequest(
        @NotNull(message = "El estado es obligatorio")
        @Pattern(regexp = "PENDIENTE|ACEPTADO|PREPARANDO|LISTO|EN_CAMINO|ENTREGADO|CANCELADO|RECHAZADO",
                message = "Estado inválido")
        String estado,

        @Size(max = 500, message = "La observación no puede superar 500 caracteres")
        String observacion
) {
}
