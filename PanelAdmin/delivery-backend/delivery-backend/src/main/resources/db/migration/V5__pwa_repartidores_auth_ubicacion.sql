-- =========================================
-- MIGRACIÓN V5: SOPORTE PWA REPARTIDORES
-- Autenticación de repartidores y última ubicación GPS
-- =========================================

INSERT INTO roles (nombre)
VALUES ('REPARTIDOR')
ON CONFLICT (nombre) DO NOTHING;

ALTER TABLE repartidores
    ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255),
    ADD COLUMN IF NOT EXISTS ultima_latitud NUMERIC(10, 7),
    ADD COLUMN IF NOT EXISTS ultima_longitud NUMERIC(10, 7),
    ADD COLUMN IF NOT EXISTS ultima_ubicacion_fecha TIMESTAMP,
    ADD COLUMN IF NOT EXISTS gps_activo BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE repartidores
    DROP CONSTRAINT IF EXISTS chk_repartidores_ultima_latitud;

ALTER TABLE repartidores
    ADD CONSTRAINT chk_repartidores_ultima_latitud
        CHECK (ultima_latitud IS NULL OR (ultima_latitud >= -90 AND ultima_latitud <= 90));

ALTER TABLE repartidores
    DROP CONSTRAINT IF EXISTS chk_repartidores_ultima_longitud;

ALTER TABLE repartidores
    ADD CONSTRAINT chk_repartidores_ultima_longitud
        CHECK (ultima_longitud IS NULL OR (ultima_longitud >= -180 AND ultima_longitud <= 180));

CREATE INDEX IF NOT EXISTS idx_repartidores_telefono
    ON repartidores(telefono);

CREATE INDEX IF NOT EXISTS idx_repartidores_dni
    ON repartidores(dni);
