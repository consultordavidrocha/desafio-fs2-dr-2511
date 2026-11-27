import { expect, test } from '@playwright/test'
import { login } from './support'

/** Regras dos frames "Responsivos" do Figma, no celular (360 × 640). */
test.use({ viewport: { width: 360, height: 640 } })

test('celular: login sem ilustração; lista sem sidebar e sem logo na barra; menu abre por cima', async ({ page }) => {
  await page.goto('/login')
  await expect(page.locator('aside')).toBeHidden() // ilustração só a partir de 1024 px

  await login(page)
  await expect(page.getByRole('navigation', { name: 'Menu principal' })).toBeHidden()
  await expect(page.getByRole('banner').getByAltText('JusCash')).toBeHidden()

  await page.getByRole('button', { name: 'Expandir menu' }).click()
  await expect(page.getByRole('navigation', { name: 'Menu principal' })).toBeVisible()
})

test('celular: tocar num card do meio da lista abre o processo no topo; voltar devolve a lista ao mesmo ponto', async ({ page }) => {
  await login(page)
  const cards = page.getByRole('main').getByRole('article')
  await expect(cards).toHaveCount(10)

  // Rola até o 8º card e toca numa área sem controle (o rótulo "Destinatários").
  const card = cards.nth(7)
  await card.scrollIntoViewIfNeeded()
  const antes = await page.evaluate(() => window.scrollY)
  expect(antes).toBeGreaterThan(500)
  await card.getByText('Destinatários', { exact: true }).click()

  await expect(page).toHaveURL(/\/processos\/\d{20}$/)
  await expect(page.getByText('Detalhes do processo')).toBeVisible()
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)

  await page.goBack()
  await expect(cards).toHaveCount(10)
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(antes - 50)
})

test('celular: trocar um filtro não pula para o topo da página', async ({ page }) => {
  await login(page)
  const tribunal = page.getByLabel('Tribunal')
  await tribunal.scrollIntoViewIfNeeded()
  await page.evaluate(() => window.scrollBy(0, 150))
  const antes = await page.evaluate(() => window.scrollY)
  expect(antes).toBeGreaterThan(0)

  await tribunal.selectOption('TRT2')
  await expect(page).toHaveURL(/tribunal=TRT2/)
  await expect(page.getByRole('main').getByRole('article').first()).toContainText('TRT2')
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
})
