package com.delivery.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record RepartidorLoginRequest(
        @NotBlank(message = "El teléfono o DNI es obligatorio")
        String identificador,

        @NotBlank(message = "La contraseña es obligatoria")
        String password
) {
}
