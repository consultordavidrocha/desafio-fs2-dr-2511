import { createBrowserRouter, Navigate } from 'react-router'
import { RedirectIfAuthenticated, RequireAuth } from './guards'
import { RootLayout } from './RootLayout'

/**
 * Cada página é carregada sob demanda (code splitting): quem abre o login
 * não baixa o código da tela de comunicações, e vice-versa.
 */
export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
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
          {
            path: '/processos/:numero',
            lazy: async () => ({
              Component: (await import('@/features/lawsuits/pages/LawsuitPage')).LawsuitPage,
            }),
          },
        ],
      },
      {
        // Pública (sem login): guia para quem avalia o case.
        path: '/guia',
        lazy: async () => ({
          Component: (await import('@/features/guide/pages/GuidePage')).GuidePage,
        }),
      },
      { path: '*', element: <Navigate to="/comunicacoes" replace /> },
    ],
  },
])
