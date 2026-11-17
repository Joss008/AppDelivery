package com.delivery.backend.entity;

import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

public enum EstadoPedido {
    PENDIENTE,
    ACEPTADO,
    PREPARANDO,
    LISTO,
    EN_CAMINO,
    ENTREGADO,
    CANCELADO,
    RECHAZADO;

    private static final Map<EstadoPedido, Set<EstadoPedido>> TRANSICIONES = Map.of(
            PENDIENTE, EnumSet.of(ACEPTADO, RECHAZADO, CANCELADO),
            ACEPTADO, EnumSet.of(PREPARANDO, LISTO, EN_CAMINO, RECHAZADO, CANCELADO),
            PREPARANDO, EnumSet.of(LISTO, EN_CAMINO, CANCELADO),
            LISTO, EnumSet.of(EN_CAMINO, CANCELADO),
            EN_CAMINO, EnumSet.of(ENTREGADO, CANCELADO),
            ENTREGADO, EnumSet.noneOf(EstadoPedido.class),
            CANCELADO, EnumSet.noneOf(EstadoPedido.class),
            RECHAZADO, EnumSet.noneOf(EstadoPedido.class)
    );

    public boolean puedeTransicionarA(EstadoPedido destino) {
        return TRANSICIONES.getOrDefault(this, Set.of()).contains(destino);
    }

    public boolean esFinal() {
        return TRANSICIONES.getOrDefault(this, Set.of()).isEmpty();
    }
}
