package com.delivery.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ActualizarEmpresaRequest(
        @NotBlank(message = "El nombre comercial es obligatorio")
        @Size(max = 150, message = "El nombre comercial no puede superar 150 caracteres")
        String nombreComercial,

        @Size(max = 200, message = "La dirección no puede superar 200 caracteres")
        String direccion,

        @Size(max = 20, message = "El teléfono no puede superar 20 caracteres")
        String telefono
) {
}
