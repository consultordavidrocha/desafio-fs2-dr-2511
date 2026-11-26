import { expect, test } from '@playwright/test'
import { login } from './support'

/** 2622250-13.2024.8.19.0546 (TJRJ): uma das comunicações diz "transitou em julgado". */
const PROCESSO = '2622250-13.2024.8.19.0546'

test.describe('Detalhes do processo', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('abre pelo número na lista e mostra selo, metadados e movimentações', async ({ page }) => {
    await page.getByLabel('Número do processo').fill(PROCESSO)
    await page.getByRole('link', { name: new RegExp(PROCESSO.replace(/\./g, '\\.')) }).first().click()

    await expect(page).toHaveURL(/\/processos\/26222501320248190546$/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText(PROCESSO)
    await expect(page.getByText('3 atualizações')).toBeVisible()
    // Selo no cabeçalho + na movimentação que menciona o trânsito.
    await expect(page.getByText('Transitou em julgado', { exact: true })).toHaveCount(2)
    await expect(page.locator('strong', { hasText: /transitou em julgado/i })).toBeVisible()
    await expect(page.getByRole('main').getByRole('article')).toHaveCount(3)
  })

  test('breadcrumb volta para Comunicações', async ({ page }) => {
    await page.goto('/processos/26222501320248190546')
    await page.getByRole('link', { name: 'Diário Oficial' }).click()
    await expect(page).toHaveURL(/\/comunicacoes$/)
  })

  test('processo inexistente mostra "Processo não encontrado"', async ({ page }) => {
    await page.goto('/processos/99999999999999999999')
    await expect(page.getByText('Processo não encontrado')).toBeVisible()
  })
})
