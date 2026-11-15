export type UserRole = 'ADMIN' | 'EMPRESA'

export interface AuthUser {
  email: string
  nombre: string
  rol: UserRole
}

export interface LoginResponse {
  token: string
  tokenType: string
  email: string
  nombre: string
  rol: UserRole
}