import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type {
  AccionPedidoRequest,
  ActualizarEmpresaRequest,
  ActualizarPedidoRequest,
  ActualizarRepartidorRequest,
  AlertaFraudeResponse,
  ApiErrorResponse,
  CambiarEstadoEmpresaRequest,
  CambiarEstadoPedidoRequest,
  CambiarEstadoReclamoRequest,
  CambiarEstadoRepartidorRequest,
  CrearPedidoRequest,
  CrearReclamoRequest,
  CrearRepartidorRequest,
  CrearUbicacionRequest,
  EmpresaResponse,
  EstadoPedido,
  EstadoRepartidor,
  LoginRequest,
  LoginResponse,
  PedidoHistorialResponse,
  PedidoResponse,
  ReclamoResponse,
  RegistroAuditoriaResponse,
  RegistroEmpresaRequest,
  RepartidorResponse,
  UbicacionResponse,
  UsuarioResponse,
} from './types';

// =========================================================
// 1. CONFIGURACIÓN BASE Y ALMACENAMIENTO DE SESIÓN JWT
// =========================================================

export const API_BASE_URL: string =
  import.meta.env.VITE_API_URL || 'http://localhost:8081/api/v1';

const TOKEN_STORAGE_KEY = 'delivery_auth_token';
const USER_STORAGE_KEY = 'delivery_auth_user';

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setAuthToken(token: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function removeAuthToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export function getStoredUser(): LoginResponse | null {
  const raw = localStorage.getItem(USER_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LoginResponse;
  } catch {
    localStorage.removeItem(USER_STORAGE_KEY);
    return null;
  }
}

export function setStoredUser(user: LoginResponse): void {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

export function clearAuthSession(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
}

// =========================================================
// 2. CLIENTE AXIOS E INTERCEPTORES
// =========================================================

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 15000,
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: unknown) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url ?? '';

    // Si el token expiró o es inválido en una ruta protegida, limpiamos sesión
    if (status === 401 && !requestUrl.includes('/auth/login')) {
      clearAuthSession();
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }

    return Promise.reject(error);
  }
);

/**
 * Extrae un objeto de error estandarizado a partir de cualquier excepción de Axios
 * compatible con GlobalExceptionHandler del backend Spring Boot.
 */
export function extractApiError(error: unknown): ApiErrorResponse {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const data = error.response?.data;
    if (data && typeof data === 'object' && 'message' in data) {
      return {
        timestamp: data.timestamp,
        status: data.status ?? error.response?.status ?? 500,
        error: data.error ?? 'Error',
        message: data.message,
        campos: data.campos,
      };
    }

    return {
      status: error.response?.status ?? 500,
      error: error.code ?? 'NetworkError',
      message:
        error.response?.status === 401
          ? 'Credenciales inválidas o sesión expirada'
          : error.response?.status === 403
            ? 'No tienes permisos para realizar esta operación'
            : error.message || 'No se pudo conectar con el servidor',
    };
  }

  return {
    status: 500,
    error: 'UnknownError',
    message: error instanceof Error ? error.message : 'Error inesperado',
  };
}

// =========================================================
// 3. MÓDULO 1: AUTENTICACIÓN (/api/v1/auth)
// =========================================================

export const authApi = {
  /**
   * POST /api/v1/auth/login
   * Autentica al usuario (ADMIN o EMPRESA), guarda el JWT en localStorage y retorna la respuesta.
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>(
      '/auth/login',
      credentials
    );
    if (data.token) {
      setAuthToken(data.token);
      setStoredUser(data);
    }
    return data;
  },

  /**
   * GET /api/v1/auth/me
   * Obtiene los datos del usuario autenticado actualmente.
   */
  async me(): Promise<UsuarioResponse> {
    const { data } = await apiClient.get<UsuarioResponse>('/auth/me');
    return data;
  },

  /**
   * Cierra la sesión local eliminando el JWT y datos almacenados.
   */
  logout(): void {
    clearAuthSession();
  },
};

// =========================================================
// 4. MÓDULO 2: EMPRESAS (/api/v1/empresas)
// =========================================================

export const empresasApi = {
  /**
   * GET /api/v1/empresas
   * ADMIN: lista todas las empresas. EMPRESA: devuelve únicamente su propia empresa.
   */
  async listar(): Promise<EmpresaResponse[]> {
    const { data } = await apiClient.get<EmpresaResponse[]>('/empresas');
    return data;
  },

  /**
   * GET /api/v1/empresas/{id}
   */
  async obtenerPorId(id: number): Promise<EmpresaResponse> {
    const { data } = await apiClient.get<EmpresaResponse>(`/empresas/${id}`);
    return data;
  },

  /**
   * POST /api/v1/empresas
   * Registra una nueva empresa y su usuario asociado con rol EMPRESA.
   */
  async registrar(
    payload: RegistroEmpresaRequest
  ): Promise<EmpresaResponse> {
    const { data } = await apiClient.post<EmpresaResponse>(
      '/empresas',
      payload
    );
    return data;
  },

  /**
   * PUT /api/v1/empresas/{id}
   * Actualiza nombreComercial, direccion y telefono de la empresa.
   */
  async actualizar(
    id: number,
    payload: ActualizarEmpresaRequest
  ): Promise<EmpresaResponse> {
    const { data } = await apiClient.put<EmpresaResponse>(
      `/empresas/${id}`,
      payload
    );
    return data;
  },

  /**
   * PATCH /api/v1/empresas/{id}/estado
   * Activa o desactiva una empresa (solo ADMIN).
   */
  async cambiarEstado(
    id: number,
    activo: boolean | CambiarEstadoEmpresaRequest
  ): Promise<EmpresaResponse> {
    const body: CambiarEstadoEmpresaRequest =
      typeof activo === 'boolean' ? { activo } : activo;
    const { data } = await apiClient.patch<EmpresaResponse>(
      `/empresas/${id}/estado`,
      body
    );
    return data;
  },
};

// =========================================================
// 5. MÓDULO 3: REPARTIDORES (/api/v1/repartidores)
// =========================================================

export const repartidoresApi = {
  /**
   * GET /api/v1/repartidores
   */
  async listar(): Promise<RepartidorResponse[]> {
    const { data } = await apiClient.get<RepartidorResponse[]>(
      '/repartidores'
    );
    return data;
  },

  /**
   * GET /api/v1/repartidores/{id}
   */
  async obtenerPorId(id: number): Promise<RepartidorResponse> {
    const { data } = await apiClient.get<RepartidorResponse>(
      `/repartidores/${id}`
    );
    return data;
  },

  /**
   * POST /api/v1/repartidores
   */
  async crear(
    payload: CrearRepartidorRequest
  ): Promise<RepartidorResponse> {
    const { data } = await apiClient.post<RepartidorResponse>(
      '/repartidores',
      payload
    );
    return data;
  },

  /**
   * PUT /api/v1/repartidores/{id}
   */
  async actualizar(
    id: number,
    payload: ActualizarRepartidorRequest
  ): Promise<RepartidorResponse> {
    const { data } = await apiClient.put<RepartidorResponse>(
      `/repartidores/${id}`,
      payload
    );
    return data;
  },

  /**
   * PATCH /api/v1/repartidores/{id}/estado
   * Cambia el estado del repartidor: DISPONIBLE | OCUPADO | INACTIVO.
   */
  async cambiarEstado(
    id: number,
    estado: EstadoRepartidor | CambiarEstadoRepartidorRequest
  ): Promise<RepartidorResponse> {
    const body: CambiarEstadoRepartidorRequest =
      typeof estado === 'string' ? { estado } : estado;
    const { data } = await apiClient.patch<RepartidorResponse>(
      `/repartidores/${id}/estado`,
      body
    );
    return data;
  },

  /**
   * DELETE /api/v1/repartidores/{id}
   */
  async eliminar(id: number): Promise<void> {
    await apiClient.delete(`/repartidores/${id}`);
  },
};

// =========================================================
// 6. MÓDULO 4 Y 6: PEDIDOS E HISTORIAL (/api/v1/pedidos)
// =========================================================

export const pedidosApi = {
  /**
   * GET /api/v1/pedidos
   */
  async listar(): Promise<PedidoResponse[]> {
    const { data } = await apiClient.get<PedidoResponse[]>('/pedidos');
    return data;
  },

  /**
   * GET /api/v1/pedidos/{id}
   */
  async obtenerPorId(id: number): Promise<PedidoResponse> {
    const { data } = await apiClient.get<PedidoResponse>(`/pedidos/${id}`);
    return data;
  },

  /**
   * POST /api/v1/pedidos
   */
  async crear(payload: CrearPedidoRequest): Promise<PedidoResponse> {
    const { data } = await apiClient.post<PedidoResponse>(
      '/pedidos',
      payload
    );
    return data;
  },

  /**
   * PUT /api/v1/pedidos/{id}
   * Actualiza datos del pedido y/o asigna repartidor de la misma empresa.
   */
  async actualizar(
    id: number,
    payload: ActualizarPedidoRequest
  ): Promise<PedidoResponse> {
    const { data } = await apiClient.put<PedidoResponse>(
      `/pedidos/${id}`,
      payload
    );
    return data;
  },

  /**
   * POST /api/v1/pedidos/{id}/aceptar
   * Transiciona el pedido de PENDIENTE a ACEPTADO.
   */
  async aceptar(
    id: number,
    observacion?: string | AccionPedidoRequest
  ): Promise<PedidoResponse> {
    const body: AccionPedidoRequest | undefined =
      typeof observacion === 'string'
        ? { observacion }
        : observacion;
    const { data } = await apiClient.post<PedidoResponse>(
      `/pedidos/${id}/aceptar`,
      body ?? {}
    );
    return data;
  },

  /**
   * POST /api/v1/pedidos/{id}/rechazar
   * Transiciona el pedido de PENDIENTE a RECHAZADO.
   */
  async rechazar(
    id: number,
    observacion?: string | AccionPedidoRequest
  ): Promise<PedidoResponse> {
    const body: AccionPedidoRequest | undefined =
      typeof observacion === 'string'
        ? { observacion }
        : observacion;
    const { data } = await apiClient.post<PedidoResponse>(
      `/pedidos/${id}/rechazar`,
      body ?? {}
    );
    return data;
  },

  /**
   * POST /api/v1/pedidos/{id}/estado
   * Cambia el estado del pedido validando transiciones permitidas y registrando en el historial.
   */
  async cambiarEstado(
    id: number,
    estadoOrPayload: EstadoPedido | CambiarEstadoPedidoRequest,
    observacion?: string
  ): Promise<PedidoResponse> {
    const body: CambiarEstadoPedidoRequest =
      typeof estadoOrPayload === 'string'
        ? { estado: estadoOrPayload, observacion }
        : estadoOrPayload;
    const { data } = await apiClient.post<PedidoResponse>(
      `/pedidos/${id}/estado`,
      body
    );
    return data;
  },

  /**
   * GET /api/v1/pedidos/{id}/historial
   * Devuelve la evolución cronológica de estados del pedido.
   */
  async listarHistorial(id: number): Promise<PedidoHistorialResponse[]> {
    const { data } = await apiClient.get<PedidoHistorialResponse[]>(
      `/pedidos/${id}/historial`
    );
    return data;
  },
};

// =========================================================
// 7. MÓDULO 5: SEGUIMIENTO Y UBICACIONES (/api/v1/ubicaciones)
// =========================================================

export const ubicacionesApi = {
  /**
   * POST /api/v1/ubicaciones
   * Registra una nueva coordenada (latitud, longitud) de un repartidor asociada a un pedido.
   */
  async crear(
    payload: CrearUbicacionRequest
  ): Promise<UbicacionResponse> {
    const { data } = await apiClient.post<UbicacionResponse>(
      '/ubicaciones',
      payload
    );
    return data;
  },

  /**
   * GET /api/v1/ubicaciones
   * Lista todas las ubicaciones visibles para el usuario autenticado (ADMIN o EMPRESA).
   */
  async listar(): Promise<UbicacionResponse[]> {
    const { data } = await apiClient.get<UbicacionResponse[]>(
      '/ubicaciones'
    );
    return data;
  },

  /**
   * GET /api/v1/pedidos/{id}/ubicaciones
   * Lista el historial de ubicaciones registradas para un pedido específico.
   */
  async listarPorPedido(pedidoId: number): Promise<UbicacionResponse[]> {
    const { data } = await apiClient.get<UbicacionResponse[]>(
      `/pedidos/${pedidoId}/ubicaciones`
    );
    return data;
  },

  /**
   * GET /api/v1/repartidores/{repartidorId}/pedidos/{pedidoId}/ubicaciones
   * Lista las ubicaciones filtradas por repartidor y pedido.
   */
  async listarPorRepartidorYPedido(
    repartidorId: number,
    pedidoId: number
  ): Promise<UbicacionResponse[]> {
    const { data } = await apiClient.get<UbicacionResponse[]>(
      `/repartidores/${repartidorId}/pedidos/${pedidoId}/ubicaciones`
    );
    return data;
  },
};

// =========================================================
// 8. MÓDULO 7: RECLAMOS E INCIDENCIAS (/api/v1/reclamos)
// =========================================================

export const reclamosApi = {
  async listar(): Promise<ReclamoResponse[]> {
    const { data } = await apiClient.get<ReclamoResponse[]>('/reclamos');
    return data;
  },

  async obtenerPorId(id: number): Promise<ReclamoResponse> {
    const { data } = await apiClient.get<ReclamoResponse>(`/reclamos/${id}`);
    return data;
  },

  async listarPorPedido(pedidoId: number): Promise<ReclamoResponse[]> {
    const { data } = await apiClient.get<ReclamoResponse[]>(
      `/pedidos/${pedidoId}/reclamos`
    );
    return data;
  },

  async crear(payload: CrearReclamoRequest): Promise<ReclamoResponse> {
    const { data } = await apiClient.post<ReclamoResponse>(
      '/reclamos',
      payload
    );
    return data;
  },

  async cambiarEstado(
    id: number,
    payload: CambiarEstadoReclamoRequest
  ): Promise<ReclamoResponse> {
    const { data } = await apiClient.patch<ReclamoResponse>(
      `/reclamos/${id}/estado`,
      payload
    );
    return data;
  },
};

// =========================================================
// 9. MÓDULO 8: ALERTAS Y AUDITORÍA (/api/v1/alertas, /api/v1/auditoria)
// =========================================================

export const alertasApi = {
  async listar(): Promise<AlertaFraudeResponse[]> {
    const { data } = await apiClient.get<AlertaFraudeResponse[]>('/alertas');
    return data;
  },

  async resolver(id: number): Promise<AlertaFraudeResponse> {
    const { data } = await apiClient.patch<AlertaFraudeResponse>(
      `/alertas/${id}/resolver`
    );
    return data;
  },
};

export const auditoriaApi = {
  async listar(): Promise<RegistroAuditoriaResponse[]> {
    const { data } =
      await apiClient.get<RegistroAuditoriaResponse[]>('/auditoria');
    return data;
  },
};

// =========================================================
// 10. OBJETO UNIFICADO DE SERVICIOS API
// =========================================================

export const api = {
  auth: authApi,
  empresas: empresasApi,
  repartidores: repartidoresApi,
  pedidos: pedidosApi,
  ubicaciones: ubicacionesApi,
  reclamos: reclamosApi,
  alertas: alertasApi,
  auditoria: auditoriaApi,
};

export default api;
