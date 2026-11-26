import { expect, test, type Page } from '@playwright/test'
import { DEMO, login } from './support'

/**
 * Aviso de "servidor ligando": no plano gratuito do Render, a API leva até ~1 min
 * para acordar. Simulamos a demora atrasando a resposta da API em 6 s (> 5 s do aviso).
 */
const AVISO = /Estamos ligando o servidor/

async function atrasar(page: Page, rota: RegExp, ms = 6_000) {
  await page.route(rota, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, ms))
    await route.fallback()
  })
}

test('login lento mostra o aviso e depois entra normalmente', async ({ page }) => {
  await atrasar(page, /\/auth\/login$/)
  await page.goto('/login')
  await page.getByLabel('E-mail').fill(DEMO.email)
  await page.getByLabel('Senha', { exact: true }).fill(DEMO.password)
  await page.getByRole('button', { name: 'Entrar' }).click()

  await expect(page.getByRole('status').filter({ hasText: AVISO })).toBeVisible({ timeout: 6_000 })
  await expect(page).toHaveURL(/\/comunicacoes$/, { timeout: 15_000 })
})

test('primeiro carregamento lento da lista mostra o aviso junto com o skeleton', async ({ page }) => {
  await login(page)
  await atrasar(page, /\/comunicacoes\?/)
  await page.reload()

  await expect(page.getByRole('status').filter({ hasText: AVISO })).toBeVisible({ timeout: 6_000 })
  await expect(page.getByRole('main').getByRole('article').first()).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText(AVISO)).toBeHidden() // some quando os dados chegam
})

test('com a API respondendo rápido, o aviso não aparece', async ({ page }) => {
  await login(page)
  await page.reload()
  await expect(page.getByRole('main').getByRole('article').first()).toBeVisible()
  await page.waitForTimeout(5_500) // passa do limite de 5 s sem nada pendente
  await expect(page.getByText(AVISO)).toBeHidden()
})
