import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type {
  AccionPedidoRequest,
  ApiErrorResponse,
  CambiarEstadoPedidoRequest,
  EstadoPedido,
  EstadoRepartidor,
  PedidoHistorialResponse,
  PedidoResponse,
  PwaUbicacionRequest,
  RepartidorLoginRequest,
  RepartidorLoginResponse,
  RepartidorResponse,
} from './types';

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:8081/api/v1';

export const TOKEN_STORAGE_KEY = 'pwa_delivery_token';
export const DRIVER_STORAGE_KEY = 'pwa_delivery_driver';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url ?? '';
      if (!requestUrl.includes('/auth/login')) {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem(DRIVER_STORAGE_KEY);
        window.dispatchEvent(new CustomEvent('pwa:unauthorized'));
      }
    }
    return Promise.reject(error);
  }
);

export function extractApiError(error: unknown): ApiErrorResponse {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    if (error.response?.data) {
      return {
        status: error.response.status,
        error: error.response.data.error || 'Error',
        message:
          error.response.data.message ||
          'Ocurrió un error al procesar la solicitud.',
        campos: error.response.data.campos,
        timestamp: error.response.data.timestamp,
      };
    }
    if (error.code === 'ERR_NETWORK') {
      return {
        status: 0,
        error: 'Network Error',
        message:
          'No se pudo conectar con el servidor central (http://localhost:8081). Verifica tu conexión.',
      };
    }
  }
  return {
    status: 500,
    error: 'Unexpected Error',
    message:
      error instanceof Error ? error.message : 'Ocurrió un error inesperado.',
  };
}

export function getStoredDriver(): RepartidorResponse | null {
  try {
    const raw = localStorage.getItem(DRIVER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as RepartidorResponse;
  } catch {
    return null;
  }
}

export function saveStoredDriver(driver: RepartidorResponse): void {
  localStorage.setItem(DRIVER_STORAGE_KEY, JSON.stringify(driver));
}

export const pwaAuthApi = {
  async login(payload: RepartidorLoginRequest): Promise<RepartidorLoginResponse> {
    const { data } = await apiClient.post<RepartidorLoginResponse>(
      '/pwa/auth/login',
      payload
    );
    localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
    saveStoredDriver(data.repartidor);
    return data;
  },

  async me(): Promise<RepartidorResponse> {
    const { data } = await apiClient.get<RepartidorResponse>('/pwa/auth/me');
    saveStoredDriver(data);
    return data;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/pwa/auth/logout');
    } catch {
      // Ignorar fallos de red al cerrar sesión local
    } finally {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(DRIVER_STORAGE_KEY);
    }
  },
};

export const pwaUbicacionesApi = {
  async registrar(payload: PwaUbicacionRequest): Promise<RepartidorResponse> {
    const { data } = await apiClient.post<RepartidorResponse>(
      '/pwa/ubicaciones',
      payload
    );
    saveStoredDriver(data);
    return data;
  },

  async desactivar(): Promise<RepartidorResponse> {
    const { data } = await apiClient.delete<RepartidorResponse>(
      '/pwa/ubicaciones'
    );
    saveStoredDriver(data);
    return data;
  },
};

export const pwaRepartidoresApi = {
  async cambiarEstado(
    repartidorId: number,
    estado: EstadoRepartidor
  ): Promise<RepartidorResponse> {
    const { data } = await apiClient.patch<RepartidorResponse>(
      `/repartidores/${repartidorId}/estado`,
      { estado }
    );
    saveStoredDriver(data);
    return data;
  },
};

export const pwaPedidosApi = {
  async listar(estado?: EstadoPedido): Promise<PedidoResponse[]> {
    const { data } = await apiClient.get<PedidoResponse[]>('/pedidos', {
      params: estado ? { estado } : undefined,
    });
    return data;
  },

  async obtener(id: number): Promise<PedidoResponse> {
    const { data } = await apiClient.get<PedidoResponse>(`/pedidos/${id}`);
    return data;
  },

  async aceptar(
    id: number,
    payload: AccionPedidoRequest = {}
  ): Promise<PedidoResponse> {
    const { data } = await apiClient.patch<PedidoResponse>(
      `/pedidos/${id}/aceptar`,
      payload
    );
    return data;
  },

  async rechazar(
    id: number,
    payload: AccionPedidoRequest = {}
  ): Promise<PedidoResponse> {
    const { data } = await apiClient.patch<PedidoResponse>(
      `/pedidos/${id}/rechazar`,
      payload
    );
    return data;
  },

  async cambiarEstado(
    id: number,
    payload: CambiarEstadoPedidoRequest
  ): Promise<PedidoResponse> {
    const { data } = await apiClient.patch<PedidoResponse>(
      `/pedidos/${id}/estado`,
      payload
    );
    return data;
  },

  async historial(id: number): Promise<PedidoHistorialResponse[]> {
    const { data } = await apiClient.get<PedidoHistorialResponse[]>(
      `/pedidos/${id}/historial`
    );
    return data;
  },
};
