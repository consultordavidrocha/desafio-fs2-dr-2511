import { createBrowserRouter, Navigate } from 'react-router'
import { RedirectIfAuthenticated, RequireAuth } from './guards'

/**
 * Cada página é carregada sob demanda (code splitting): quem abre o login
 * não baixa o código da tela de comunicações, e vice-versa.
 */
export const router = createBrowserRouter([
  {
    element: <RedirectIfAuthenticated />,
    children: [
      {
        path: '/login',
        lazy: async () => ({
          Component: (await import('@/features/auth/pages/LoginPage')).LoginPage,
        }),
      },
      {
        path: '/cadastro',
        lazy: async () => ({
          Component: (await import('@/features/auth/pages/SignUpPage')).SignUpPage,
        }),
      },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        path: '/comunicacoes',
        lazy: async () => ({
          Component: (await import('@/features/communications/pages/CommunicationsPage'))
            .CommunicationsPage,
        }),
      },
    ],
  },
  { path: '*', element: <Navigate to="/comunicacoes" replace /> },
])
