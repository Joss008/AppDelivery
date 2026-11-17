# PWA Delivery · Aplicación Operativa de Repartidores

Aplicación Web Progresiva (PWA) construida con el mismo stack de `PanelAdmin/delivery-frontend` (**React 19 + Vite 8 + TypeScript + Tailwind CSS v4 + TanStack Query + React Router v7 + Axios + Lucide React**) y conectada al backend unificado de `PanelAdmin/delivery-backend`.

## Estructura
- `PWA/frontend`: Código fuente completo de la PWA de repartidores (puerto `5174`).
- `PWA/backend`: Referencia al backend unificado alojado en `PanelAdmin/delivery-backend/delivery-backend` (puerto `8081`).

## Ejecución Rápida

1. **Iniciar el Backend Unificado (`port 8081`)**:
   ```bash
   cd ../PanelAdmin/delivery-backend/delivery-backend
   ./mvnw spring-boot:run
   ```

2. **Iniciar la PWA de Repartidores (`port 5174`)**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
