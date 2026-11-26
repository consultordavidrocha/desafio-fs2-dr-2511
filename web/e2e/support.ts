import { expect, type Page } from '@playwright/test'

/** Conta criada pelo seed da API (api/src/database/seed/demo-user.ts). */
export const DEMO = { email: 'demo@exemplo.com', password: 'demo12345', initials: 'UD' }

/** E-mail único por execução, para os testes de cadastro não colidirem. */
export const uniqueEmail = (prefix: string) =>
  `${prefix}.${Date.now()}.${Math.floor(Math.random() * 1e4)}@exemplo.com`

export async function login(page: Page, email = DEMO.email, password = DEMO.password) {
  await page.goto('/login')
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Senha', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL(/\/comunicacoes/)
  await expect(page.getByRole('heading', { name: 'Comunicações' })).toBeVisible()
}

/** Cards de comunicação da lista atual. */
export const cards = (page: Page) => page.getByRole('main').getByRole('article')
