import { Outlet, ScrollRestoration } from 'react-router'

/**
 * Raiz de todas as rotas. O <ScrollRestoration> faz cada página nova (abrir um
 * processo, por exemplo) começar no topo e, ao voltar, devolve a lista à posição
 * em que estava. Trocas de filtro e de página usam `preventScrollReset`, para
 * não pular para o topo a cada mudança na URL.
 */
export function RootLayout() {
  return (
    <>
      <ScrollRestoration />
      <Outlet />
    </>
  )
}
