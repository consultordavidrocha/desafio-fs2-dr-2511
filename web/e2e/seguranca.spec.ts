import { expect, test } from '@playwright/test'
import { cards, login } from './support'

/**
 * Cabeçalhos de segurança do front (auditoria de 26/11). Localmente, o `vite preview`
 * aplica os mesmos cabeçalhos do vercel.json (vite.config.ts). Assim, a suíte inteira
 * roda sob a CSP de produção, e este teste falha se alguma tela violar a política.
 */
test('envia CSP, anti-frame e nosniff', async ({ page }) => {
  const res = await page.goto('/login')
  const h = res!.headers()
  expect(h['content-security-policy']).toContain("script-src 'self'")
  expect(h['content-security-policy']).toContain("frame-ancestors 'none'")
  expect(h['x-frame-options']).toBe('DENY')
  expect(h['x-content-type-options']).toBe('nosniff')
  expect(h['referrer-policy']).toBe('strict-origin-when-cross-origin')
})

test('o fluxo principal não viola a CSP', async ({ page }) => {
  const violacoes: string[] = []
  page.on('console', (msg) => {
    if (/Content Security Policy/i.test(msg.text())) violacoes.push(msg.text())
  })

  await login(page)
  await expect(cards(page).first()).toBeVisible()
  await cards(page).first().getByRole('button', { name: 'Resumir' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await page.goto('/processos/26222501320248190546')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

  expect(violacoes).toEqual([])
})
