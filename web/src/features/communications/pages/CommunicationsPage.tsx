import { useAuth } from '@/features/auth/use-auth'

/** Provisório: a tela completa de comunicações vem no próximo passo. */
export function CommunicationsPage() {
  const { user, logout } = useAuth()
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4">
      <h1 className="text-title font-bold">Comunicações</h1>
      <p>Olá, {user?.name ?? '...'}!</p>
      <button type="button" onClick={logout} className="text-link hover:underline">
        Sair
      </button>
    </main>
  )
}
