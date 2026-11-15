package com.delivery.backend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record ActualizarPedidoRequest(
        Long repartidorId,

        @NotBlank(message = "El nombre del cliente es obligatorio")
        @Size(max = 100, message = "El nombre del cliente no puede superar 100 caracteres")
        String nombreCliente,

        @Size(max = 20, message = "El teléfono no puede superar 20 caracteres")
        String telefonoCliente,

        @NotBlank(message = "La dirección de entrega es obligatoria")
        @Size(max = 200, message = "La dirección no puede superar 200 caracteres")
        String direccionEntrega,

        @Size(max = 200, message = "La referencia no puede superar 200 caracteres")
        String referenciaDireccion,

        @Size(max = 500, message = "La descripción no puede superar 500 caracteres")
        String descripcion,

        @NotNull(message = "El importe es obligatorio")
        @DecimalMin(value = "0", message = "El importe no puede ser negativo")
        BigDecimal importe
) {
}
