import { z } from 'zod'

/**
 * Validações dos formulários. As mensagens são as do Figma e espelham as
 * regras da API (a API valida de novo: o front é só para feedback rápido).
 */
export const MIN_PASSWORD_LENGTH = 8

const email = z.string().trim().toLowerCase().email('Informe um e-mail válido.')

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Informe a senha.'),
})

export const signUpSchema = z
  .object({
    name: z.string().trim().min(2, 'Informe o nome completo.').max(120, 'O nome deve ter no máximo 120 caracteres.'),
    email,
    password: z
      .string()
      .min(MIN_PASSWORD_LENGTH, `A senha deve ter no mínimo ${MIN_PASSWORD_LENGTH} caracteres.`)
      .max(72, 'A senha deve ter no máximo 72 caracteres.'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem.',
    path: ['confirmPassword'],
  })

export type LoginForm = z.infer<typeof loginSchema>
export type SignUpForm = z.infer<typeof signUpSchema>
