package com.delivery.backend.dto;

public record LoginResponse(
        String token,
        String tokenType,
        String email,
        String nombre,
        String rol
) {
}
