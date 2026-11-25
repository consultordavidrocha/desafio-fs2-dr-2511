import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router'
import { Button } from '@/components/ui/Button'
import { FormAlert } from '@/components/ui/FormAlert'
import { TextField } from '@/components/ui/TextField'
import { ApiError } from '@/lib/api-client'
import { useAuth } from '../use-auth'
import { AuthHeading, AuthLayout } from '../components/AuthLayout'
import { loginSchema, type LoginForm } from '../schemas'

const GENERIC_ERROR = 'Não foi possível entrar agora. Tente novamente em instantes.'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  const onSubmit = handleSubmit(async (data) => {
    setFormError(null)
    try {
      await login(data)
      // Volta para a página protegida que o usuário tentou abrir, se houver.
      const from = (location.state as { from?: string } | null)?.from
      navigate(from ?? '/comunicacoes', { replace: true })
    } catch (error) {
      // 401 e 400 trazem mensagem pronta da API; o resto vira mensagem genérica.
      const isKnown = error instanceof ApiError && [0, 400, 401].includes(error.status)
      setFormError(isKnown ? error.message : GENERIC_ERROR)
    }
  })

  // Figma: com erro de credenciais, os dois campos ficam com borda vermelha.
  const invalidCredentials = Boolean(formError)

  return (
    <AuthLayout>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <AuthHeading title="Bem-vindo de volta" subtitle="Acesse sua conta para continuar" />

        <TextField
          label="E-mail"
          type="email"
          autoComplete="email"
          placeholder="seu@email.com"
          error={errors.email?.message}
          invalid={invalidCredentials}
          {...register('email')}
        />
        <TextField
          label="Senha"
          type="password"
          autoComplete="current-password"
          placeholder="*******"
          error={errors.password?.message}
          invalid={invalidCredentials}
          {...register('password')}
        />

        {formError && <FormAlert message={formError} />}

        <Button type="submit" loading={isSubmitting}>
          Entrar
        </Button>

        <p className="text-center">
          Não tem conta?{' '}
          <Link to="/cadastro" className="text-link hover:underline">
            Cadastre-se
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
