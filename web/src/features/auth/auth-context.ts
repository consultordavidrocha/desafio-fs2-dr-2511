import { createContext } from 'react'
import type { LoginInput, User } from './api'

export interface AuthContextValue {
  isAuthenticated: boolean
  /** Usuário logado (carregado de GET /auth/me); `undefined` enquanto carrega. */
  user: User | undefined
  login: (input: LoginInput) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
