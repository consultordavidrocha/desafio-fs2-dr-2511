import { apiRequest } from '@/lib/api-client'

export interface User {
  id: string
  name: string
  email: string
}

export interface SignUpInput {
  name: string
  email: string
  password: string
}

export interface LoginInput {
  email: string
  password: string
}

export const authApi = {
  signUp: (input: SignUpInput) =>
    apiRequest<User>('/auth/cadastro', { method: 'POST', body: input }),

  login: (input: LoginInput) =>
    apiRequest<{ accessToken: string }>('/auth/login', { method: 'POST', body: input }),

  me: (signal?: AbortSignal) => apiRequest<User>('/auth/me', { signal }),
}
