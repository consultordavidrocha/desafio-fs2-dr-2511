import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { Button } from '@/components/ui/Button'
import { FormAlert } from '@/components/ui/FormAlert'
import { TextField } from '@/components/ui/TextField'
import { ApiError } from '@/lib/api-client'
import { authApi } from '../api'
import { useAuth } from '../use-auth'
import { AuthHeading, AuthLayout } from '../components/AuthLayout'
import { MIN_PASSWORD_LENGTH, signUpSchema, type SignUpForm } from '../schemas'

const GENERIC_ERROR = 'Não foi possível criar a conta agora. Tente novamente em instantes.'

export function SignUpPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignUpForm>({ resolver: zodResolver(signUpSchema) })

  const onSubmit = handleSubmit(async ({ name, email, password }) => {
    setFormError(null)
    try {
      await authApi.signUp({ name, email, password })
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setError('email', { message: 'Este e-mail já está cadastrado.' }, { shouldFocus: true })
      } else {
        setFormError(error instanceof ApiError && error.status === 0 ? error.message : GENERIC_ERROR)
      }
      return
    }

    // Conta criada: entra direto, sem obrigar o usuário a digitar tudo de novo.
    try {
      await login({ email, password })
      navigate('/comunicacoes', { replace: true })
    } catch {
      navigate('/login', { replace: true })
    }
  })

  const passwordsMismatch = errors.confirmPassword?.message === 'As senhas não coincidem.'

  return (
    <AuthLayout>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <AuthHeading title="Criar conta" subtitle="Preencha os dados para se cadastrar" />

        <TextField
          label="Nome completo"
          autoComplete="name"
          placeholder="Seu nome"
          error={errors.name?.message}
          {...register('name')}
        />
        <TextField
          label="E-mail"
          type="email"
          autoComplete="email"
          placeholder="seu@email.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <TextField
          label="Senha"
          type="password"
          autoComplete="new-password"
          placeholder="*******"
          // Figma: quando as senhas não coincidem, os dois campos ficam vermelhos
          // e o texto de apoio da senha some (o erro aparece só na confirmação).
          helperText={passwordsMismatch ? undefined : `Mínimo de ${MIN_PASSWORD_LENGTH} caracteres`}
          error={errors.password?.message}
          invalid={passwordsMismatch}
          {...register('password')}
        />
        <TextField
          label="Confirme sua senha"
          type="password"
          autoComplete="new-password"
          placeholder="*******"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        {formError && <FormAlert message={formError} />}

        <Button type="submit" loading={isSubmitting}>
          Criar conta
        </Button>

        <p className="text-center">
          Já tem conta?{' '}
          <Link to="/login" className="text-link hover:underline">
            Entrar
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
