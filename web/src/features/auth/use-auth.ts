import { useContext } from 'react'
import { AuthContext, type AuthContextValue } from './auth-context'

/** Sessão atual: usuário, login e logout. */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth precisa estar dentro de <AuthProvider>.')
  return context
}
