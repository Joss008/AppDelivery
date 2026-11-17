# Backend Unificado en `PanelAdmin/delivery-backend`

Por arquitectura del proyecto, **no se requiere levantar un segundo backend aquí**.

El backend principal ubicado en:
```text
PanelAdmin/delivery-backend/delivery-backend
```
sirve simultáneamente a:
1. **Panel Administrativo / Empresas** (`PanelAdmin/delivery-frontend`)
2. **PWA de Repartidores** (`PWA/frontend`)

## Endpoints dedicados a la PWA en `PanelAdmin/delivery-backend`
- `POST /api/v1/pwa/auth/login` — Inicio de sesión del repartidor con Teléfono o DNI + Contraseña.
- `GET /api/v1/pwa/auth/me` — Perfil y estado actual del repartidor autenticado.
- `POST /api/v1/pwa/auth/logout` — Cierre de turno y desactivación de señal GPS.
- `POST /api/v1/pwa/ubicaciones` — Reporte de coordenadas GPS en tiempo real y trazabilidad de ruta.
- `DELETE /api/v1/pwa/ubicaciones` — Pausa del rastreo GPS.
- `GET /api/v1/pedidos`, `PATCH /api/v1/pedidos/{id}/aceptar`, `PATCH /api/v1/pedidos/{id}/rechazar`, `PATCH /api/v1/pedidos/{id}/estado` — Gestión completa de entregas desde la PWA.
