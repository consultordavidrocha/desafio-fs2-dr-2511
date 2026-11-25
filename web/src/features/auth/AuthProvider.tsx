import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { UNAUTHORIZED_EVENT } from '@/lib/api-client'
import { tokenStorage } from '@/lib/token-storage'
import { authApi, type LoginInput } from './api'
import { AuthContext } from './auth-context'

/** Guarda o token, carrega o usuário logado e encerra a sessão em caso de 401. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [token, setToken] = useState(() => tokenStorage.get())

  const { data: user } = useQuery({
    queryKey: ['auth', 'me', token],
    queryFn: ({ signal }) => authApi.me(signal),
    enabled: Boolean(token),
    staleTime: Infinity,
  })

  const login = useCallback(async (input: LoginInput) => {
    const { accessToken } = await authApi.login(input)
    tokenStorage.set(accessToken)
    setToken(accessToken)
  }, [])

  const logout = useCallback(() => {
    tokenStorage.clear()
    setToken(null)
    queryClient.clear() // nada de dados do usuário anterior em cache
  }, [queryClient])

  // Token expirado/inválido em qualquer chamada → encerra a sessão.
  useEffect(() => {
    window.addEventListener(UNAUTHORIZED_EVENT, logout)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, logout)
  }, [logout])

  const value = useMemo(
    () => ({ isAuthenticated: Boolean(token), user, login, logout }),
    [token, user, login, logout],
  )
  return <AuthContext value={value}>{children}</AuthContext>
}
