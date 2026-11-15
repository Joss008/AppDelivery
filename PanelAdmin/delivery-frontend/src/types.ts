// =========================================================
// 1. ROLES Y ESTADOS (Uniones de tipos compatibles con TS erasableSyntaxOnly)
// =========================================================

export type RolUsuario = 'ADMIN' | 'EMPRESA';

export const ROLES_USUARIO = {
  ADMIN: 'ADMIN',
  EMPRESA: 'EMPRESA',
} as const;

export type EstadoRepartidor = 'DISPONIBLE' | 'OCUPADO' | 'INACTIVO';

export const ESTADOS_REPARTIDOR = {
  DISPONIBLE: 'DISPONIBLE',
  OCUPADO: 'OCUPADO',
  INACTIVO: 'INACTIVO',
} as const;

export type EstadoPedido =
  | 'PENDIENTE'
  | 'ACEPTADO'
  | 'PREPARANDO'
  | 'LISTO'
  | 'EN_CAMINO'
  | 'ENTREGADO'
  | 'CANCELADO'
  | 'RECHAZADO';

export const ESTADOS_PEDIDO = {
  PENDIENTE: 'PENDIENTE',
  ACEPTADO: 'ACEPTADO',
  PREPARANDO: 'PREPARANDO',
  LISTO: 'LISTO',
  EN_CAMINO: 'EN_CAMINO',
  ENTREGADO: 'ENTREGADO',
  CANCELADO: 'CANCELADO',
  RECHAZADO: 'RECHAZADO',
} as const;

export type EstadoReclamo = 'PENDIENTE' | 'EN_PROCESO' | 'RESUELTO' | 'RECHAZADO';

export type SeveridadAlerta = 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';

// =========================================================
// 2. MANEJO DE ERRORES HTTP (GlobalExceptionHandler)
// =========================================================

export interface ApiErrorResponse {
  timestamp?: string;
  status: number;
  error: string;
  message: string;
  /** Errores de validación por campo devueltos en HTTP 400 */
  campos?: Record<string, string>;
}

// =========================================================
// 3. MÓDULO 1: AUTENTICACIÓN Y USUARIOS (/api/v1/auth)
// =========================================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  tokenType: string;
  email: string;
  nombre: string;
  rol: RolUsuario;
}

export interface UsuarioResponse {
  id: number;
  nombre: string;
  email: string;
  rol: RolUsuario;
}

// =========================================================
// 4. MÓDULO 2: EMPRESAS (/api/v1/empresas)
// =========================================================

export interface RegistroEmpresaRequest {
  nombre: string;
  email: string;
  password: string;
  nombreComercial: string;
  direccion?: string;
  telefono?: string;
}

export interface ActualizarEmpresaRequest {
  nombreComercial: string;
  direccion?: string;
  telefono?: string;
}

export interface CambiarEstadoRequest {
  activo: boolean;
}

export type CambiarEstadoEmpresaRequest = CambiarEstadoRequest;

export interface EmpresaResponse {
  id: number;
  nombre: string;
  email: string;
  nombreComercial: string;
  direccion: string | null;
  telefono: string | null;
  activo: boolean;
}

// =========================================================
// 5. MÓDULO 3: REPARTIDORES (/api/v1/repartidores)
// =========================================================

export interface CrearRepartidorRequest {
  empresaId: number;
  nombre: string;
  dni: string;
  telefono?: string;
}

export interface ActualizarRepartidorRequest {
  nombre: string;
  dni: string;
  telefono?: string;
}

export interface CambiarEstadoRepartidorRequest {
  estado: EstadoRepartidor;
}

export interface RepartidorResponse {
  id: number;
  empresaId: number;
  nombreComercialEmpresa: string;
  nombre: string;
  dni: string;
  telefono: string | null;
  estado: EstadoRepartidor;
  /** ISO 8601 LocalDateTime string */
  fechaRegistro: string;
}

// =========================================================
// 6. MÓDULO 4 Y 6: PEDIDOS E HISTORIAL (/api/v1/pedidos)
// =========================================================

export interface CrearPedidoRequest {
  empresaId: number;
  repartidorId?: number | null;
  nombreCliente: string;
  telefonoCliente?: string;
  direccionEntrega: string;
  referenciaDireccion?: string;
  descripcion?: string;
  importe: number;
}

export interface ActualizarPedidoRequest {
  repartidorId?: number | null;
  nombreCliente: string;
  telefonoCliente?: string;
  direccionEntrega: string;
  referenciaDireccion?: string;
  descripcion?: string;
  importe: number;
}

export interface CambiarEstadoPedidoRequest {
  estado: EstadoPedido;
  observacion?: string;
}

export interface AccionPedidoRequest {
  observacion?: string;
}

export interface PedidoResponse {
  id: number;
  empresaId: number;
  nombreComercialEmpresa: string;
  repartidorId: number | null;
  nombreRepartidor: string | null;
  nombreCliente: string;
  telefonoCliente: string | null;
  direccionEntrega: string;
  referenciaDireccion: string | null;
  descripcion: string | null;
  importe: number;
  estado: EstadoPedido;
  /** ISO 8601 LocalDateTime string */
  fechaCreacion: string;
  /** ISO 8601 LocalDateTime string */
  fechaActualizacion: string | null;
}

export interface PedidoHistorialResponse {
  id: number;
  pedidoId: number;
  estadoAnterior: EstadoPedido | null;
  estadoNuevo: EstadoPedido;
  usuarioId: number;
  nombreUsuario: string;
  /** ISO 8601 LocalDateTime string */
  fecha: string;
  observacion: string | null;
}

// =========================================================
// 7. MÓDULO 5: SEGUIMIENTO Y UBICACIONES (/api/v1/ubicaciones)
// =========================================================

export interface CrearUbicacionRequest {
  repartidorId: number;
  pedidoId: number;
  latitud: number;
  longitud: number;
}

export interface UbicacionResponse {
  id: number;
  repartidorId: number;
  nombreRepartidor: string;
  pedidoId: number;
  empresaId: number;
  latitud: number;
  longitud: number;
  /** ISO 8601 LocalDateTime string */
  fechaRegistro: string;
}

// =========================================================
// 8. MÓDULO 7: RECLAMOS E INCIDENCIAS (/api/v1/reclamos)
// =========================================================

export interface CrearReclamoRequest {
  pedidoId: number;
  motivo: string;
  descripcion: string;
}

export interface CambiarEstadoReclamoRequest {
  estado: EstadoReclamo;
  observacion?: string;
}

export interface ReclamoResponse {
  id: number;
  pedidoId: number;
  empresaId: number;
  motivo: string;
  descripcion: string;
  estado: EstadoReclamo;
  observacion: string | null;
  fechaCreacion: string;
  fechaActualizacion: string | null;
}

// =========================================================
// 9. MÓDULO 8: ALERTAS Y AUDITORÍA (/api/v1/alertas, /api/v1/auditoria)
// =========================================================

export interface AlertaFraudeResponse {
  id: number;
  empresaId?: number | null;
  pedidoId?: number | null;
  usuarioId?: number | null;
  tipo: string;
  severidad: SeveridadAlerta;
  descripcion: string;
  fecha: string;
  resuelta: boolean;
}

export interface RegistroAuditoriaResponse {
  id: number;
  usuarioId: number;
  nombreUsuario?: string;
  accion: string;
  entidad?: string;
  entidadId?: number | null;
  descripcion: string;
  fecha: string;
}
