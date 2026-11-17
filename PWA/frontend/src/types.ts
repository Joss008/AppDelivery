// =========================================================
// TIPOS DE DOMINIO Y CONTRATOS HTTP - PWA REPARTIDORES
// =========================================================

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

export interface ApiErrorResponse {
  timestamp?: string;
  status: number;
  error: string;
  message: string;
  campos?: Record<string, string>;
}

export interface RepartidorLoginRequest {
  identificador: string;
  password: string;
}

export interface RepartidorResponse {
  id: number;
  empresaId: number;
  nombreComercialEmpresa: string;
  nombre: string;
  dni: string;
  telefono: string | null;
  estado: EstadoRepartidor;
  fechaRegistro: string;
  ultimaLatitud?: number | null;
  ultimaLongitud?: number | null;
  ultimaUbicacionFecha?: string | null;
  gpsActivo?: boolean;
}

export interface RepartidorLoginResponse {
  token: string;
  tokenType: string;
  repartidor: RepartidorResponse;
}

export interface PwaUbicacionRequest {
  latitud: number;
  longitud: number;
  pedidoId?: number | null;
}

export interface PedidoResponse {
  id: number;
  empresaId: number;
  nombreComercialEmpresa: string;
  direccionRecojo?: string | null;
  telefonoEmpresa?: string | null;
  repartidorId: number | null;
  nombreRepartidor: string | null;
  nombreCliente: string;
  telefonoCliente: string | null;
  direccionEntrega: string;
  referenciaDireccion: string | null;
  descripcion: string | null;
  importe: number;
  estado: EstadoPedido;
  fechaCreacion: string;
  fechaActualizacion: string | null;
}

export interface PedidoHistorialResponse {
  id: number;
  pedidoId: number;
  estadoAnterior: EstadoPedido | null;
  estadoNuevo: EstadoPedido;
  usuarioId: number;
  nombreUsuario: string;
  fecha: string;
  observacion: string | null;
}

export interface CambiarEstadoPedidoRequest {
  estado: EstadoPedido;
  observacion?: string;
  latitud?: number;
  longitud?: number;
}

export interface AccionPedidoRequest {
  observacion?: string;
}
