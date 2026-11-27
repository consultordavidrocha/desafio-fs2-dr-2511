import { expect, test } from '@playwright/test'

/** Guia do avaliador: página pública, sem login. */
test('/guia abre sem login, sob a CSP, com os links públicos abrindo em nova aba', async ({ page }) => {
  const violacoes: string[] = []
  page.on('console', (msg) => {
    if (/Content Security Policy/i.test(msg.text())) violacoes.push(msg.text())
  })

  await page.goto('/guia')
  await expect(page).toHaveURL(/\/guia$/) // não redireciona para o login
  await expect(page.getByRole('heading', { level: 1, name: 'Guia do avaliador' })).toBeVisible()
  for (const secao of ['Aplicação e repositório', 'Onde avaliar cada bloco', 'Parte 2: problemas P1 a P7', 'Testes', 'Além do enunciado']) {
    await expect(page.getByRole('heading', { level: 2, name: secao })).toBeVisible()
  }
  await expect(page.getByText('demo@exemplo.com')).toBeVisible()

  // Links externos: só https, sempre em nova aba; nenhum caminho local (file://, C:\...).
  const externos = page.getByRole('main').locator('a[target="_blank"]')
  expect(await externos.count()).toBeGreaterThan(20)
  for (const href of await externos.evaluateAll((as) => as.map((a) => a.getAttribute('href') ?? ''))) {
    expect(href).toMatch(/^https:\/\//)
  }
  expect(await page.content()).not.toMatch(/file:\/\/|[A-Z]:\|NOTAS-DEFESA|GUIA-DEPLOY|RESUMO-CASE/)

  await page.getByRole('link', { name: 'Abrir a aplicação', exact: true }).click()
  await expect(page).toHaveURL(/\/login$/)
  expect(violacoes).toEqual([])
})
