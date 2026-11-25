/**
 * Persistência do access token.
 *
 * Trade-off: localStorage é simples e sobrevive ao recarregar a página, mas é
 * legível por JavaScript (risco em caso de XSS). A alternativa mais segura seria
 * um cookie httpOnly emitido pela API, mas o contrato do case fixa o login
 * devolvendo `{ accessToken }` no corpo da resposta.
 */
const KEY = 'juscash.accessToken'

export const tokenStorage = {
  get(): string | null {
    try {
      return localStorage.getItem(KEY)
    } catch {
      return null // navegação privada/bloqueio de storage
    }
  },
  set(token: string): void {
    try {
      localStorage.setItem(KEY, token)
    } catch {
      /* sem storage: a sessão dura só até recarregar a página */
    }
  },
  clear(): void {
    try {
      localStorage.removeItem(KEY)
    } catch {
      /* nada a limpar */
    }
  },
}
