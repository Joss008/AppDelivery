package com.delivery.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record RepartidorResponse(
        Long id,
        Long empresaId,
        String nombreComercialEmpresa,
        String nombre,
        String dni,
        String telefono,
        String estado,
        LocalDateTime fechaRegistro,
        BigDecimal ultimaLatitud,
        BigDecimal ultimaLongitud,
        LocalDateTime ultimaUbicacionFecha,
        Boolean gpsActivo
) {
}
