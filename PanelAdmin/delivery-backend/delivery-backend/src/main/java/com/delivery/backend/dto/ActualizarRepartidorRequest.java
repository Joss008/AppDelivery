package com.delivery.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ActualizarRepartidorRequest(
        @NotBlank(message = "El nombre es obligatorio")
        @Size(max = 100, message = "El nombre no puede superar 100 caracteres")
        String nombre,

        @NotBlank(message = "El DNI es obligatorio")
        @Size(max = 20, message = "El DNI no puede superar 20 caracteres")
        String dni,

        @Size(max = 20, message = "El teléfono no puede superar 20 caracteres")
        String telefono
) {
}
