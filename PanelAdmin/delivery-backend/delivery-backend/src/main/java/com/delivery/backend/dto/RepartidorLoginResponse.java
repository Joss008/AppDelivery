package com.delivery.backend.dto;

public record RepartidorLoginResponse(
        String token,
        String tokenType,
        RepartidorResponse repartidor
) {
}
