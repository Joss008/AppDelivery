package com.delivery.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "repartidores")
@Getter
@Setter
public class Repartidor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(nullable = false, length = 20)
    private String dni;

    @Column(length = 20)
    private String telefono;

    @Column(name = "password_hash", length = 255)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EstadoRepartidor estado = EstadoRepartidor.DISPONIBLE;

    @Column(name = "ultima_latitud", precision = 10, scale = 7)
    private BigDecimal ultimaLatitud;

    @Column(name = "ultima_longitud", precision = 10, scale = 7)
    private BigDecimal ultimaLongitud;

    @Column(name = "ultima_ubicacion_fecha")
    private LocalDateTime ultimaUbicacionFecha;

    @Column(name = "gps_activo", nullable = false)
    private Boolean gpsActivo = false;

    @Column(name = "fecha_registro", nullable = false, updatable = false)
    private LocalDateTime fechaRegistro;
}
