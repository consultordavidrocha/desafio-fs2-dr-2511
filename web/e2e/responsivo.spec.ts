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
