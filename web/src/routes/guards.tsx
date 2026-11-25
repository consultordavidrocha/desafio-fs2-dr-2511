import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '@/features/auth/use-auth'

/** Rotas que exigem sessão: sem token, redireciona para o login (guardando o destino). */
export function RequireAuth() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }
  return <Outlet />
}

/**
 * Login e cadastro: quem já está logado vai para a página que tentou abrir
 * (guardada pelo RequireAuth) ou, por padrão, para as comunicações.
 */
export function RedirectIfAuthenticated() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/comunicacoes'
  return isAuthenticated ? <Navigate to={from} replace /> : <Outlet />
}
