import { expect, test } from '@playwright/test'
import { cards, login } from './support'

/** Dados do case (dados/comunicacoes.json): 120 comunicações, 23 do TRT2. */
test.describe('Comunicações', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('lista 10 por página, da mais recente para a mais antiga, com paginação', async ({ page }) => {
    await expect(cards(page)).toHaveCount(10)
    const datas = await page.getByRole('main').locator('time').allTextContents()
    const iso = datas.map((d) => d.split('/').reverse().join('-'))
    expect(iso).toEqual([...iso].sort().reverse())

    await page.getByRole('button', { name: 'Próximo' }).click()
    await expect(page).toHaveURL(/page=2/)
    await expect(cards(page)).toHaveCount(10)
    await expect(page.getByRole('button', { name: 'Página 2' })).toHaveAttribute('aria-current', 'page')
  })

  test('filtro por tribunal', async ({ page }) => {
    await page.getByLabel('Tribunal').selectOption('TRT2')
    await expect(page).toHaveURL(/tribunal=TRT2/)
    await expect(cards(page)).toHaveCount(10)
    for (const card of await cards(page).all()) await expect(card).toContainText('TRT2')
    // 23 comunicações do TRT2 → 3 páginas
    await expect(page.getByRole('button', { name: 'Página 3' })).toBeVisible()
  })

  test('busca por número aplica a máscara e só busca com os 20 dígitos', async ({ page }) => {
    const busca = page.getByLabel('Número do processo')
    await busca.pressSequentially('26222501')
    await expect(busca).toHaveValue('2622250-1')
    await expect(page.getByText('Digite os 20 dígitos do número CNJ para buscar.')).toBeVisible()

    await busca.pressSequentially('320248190546')
    await expect(busca).toHaveValue('2622250-13.2024.8.19.0546')
    await expect(page).toHaveURL(/numeroProcesso=/)
    await expect(cards(page)).toHaveCount(3)
    for (const card of await cards(page).all()) await expect(card).toContainText('2622250-13.2024.8.19.0546')
  })

  test('período pelo calendário de 2 meses (limites inclusivos)', async ({ page }) => {
    await page.getByRole('button', { name: 'Filtrar por período' }).click()
    const dialogo = page.getByRole('dialog', { name: 'Selecionar período' })
    await expect(dialogo).toBeVisible()
    // Navega até agosto/2025 (os dados vão de jun a out/2025).
    while (!(await dialogo.getByText('Agosto 2025').isVisible())) {
      await dialogo.getByRole('button', { name: 'Mês anterior' }).click()
    }
    await dialogo.getByRole('button', { name: '01/08/2025' }).first().click()
    await dialogo.getByRole('button', { name: '31/08/2025' }).first().click()

    await expect(page).toHaveURL(/dataInicio=2025-08-01&dataFim=2025-08-31|dataFim=2025-08-31.*dataInicio=2025-08-01/)
    await expect(page.getByRole('button', { name: /Período: 01\/08\/2025 - 31\/08\/2025/ })).toBeVisible()
    for (const data of await page.getByRole('main').locator('time').allTextContents()) {
      expect(data).toMatch(/\/08\/2025$/)
    }

    await page.getByRole('button', { name: 'Limpar período' }).click()
    await expect(page).not.toHaveURL(/dataInicio/)
  })

  test('estado vazio', async ({ page }) => {
    await page.getByLabel('Número do processo').fill('00000000000000000000')
    await expect(page.getByText('Nenhuma comunicação encontrada')).toBeVisible()
  })

  test('estado de erro com "Tentar novamente"', async ({ page }) => {
    let falhar = true
    await page.route(/\/comunicacoes\?/, (route) =>
      falhar ? route.fulfill({ status: 500, contentType: 'application/json', body: '{"message":"x"}' }) : route.fallback(),
    )
    await page.getByLabel('Tribunal').selectOption('TJSP')
    await expect(page.getByText('Não foi possível carregar as comunicações')).toBeVisible({ timeout: 15_000 })

    falhar = false
    await page.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(cards(page).first()).toContainText('TJSP')
  })

  test('"Ler mais" expande e recolhe o conteúdo', async ({ page }) => {
    const botao = page.getByRole('button', { name: 'Ler mais' }).first()
    await botao.click()
    await expect(page.getByRole('button', { name: 'Ler menos' }).first()).toHaveAttribute('aria-expanded', 'true')
    await page.getByRole('button', { name: 'Ler menos' }).first().click()
    await expect(page.getByRole('button', { name: 'Ler mais' }).first()).toBeVisible()
  })

  test('clique no card expande e recolhe; "Resumir" e o link do processo não expandem', async ({ page }) => {
    // Fixa o card pela posição: um filtro por "Ler mais" pularia para outro card assim que este expandisse.
    await expect(cards(page).first()).toBeVisible()
    const todos = await cards(page).all()
    let indice = 0
    while ((await todos[indice].getByRole('button', { name: 'Ler mais' }).count()) === 0) indice++
    const card = cards(page).nth(indice)
    const toggle = card.getByRole('button', { name: /Ler (mais|menos)/ })

    // Clique numa área sem controle (o rótulo "Conteúdo") faz o mesmo que "Ler mais"/"Ler menos".
    await card.getByText('Conteúdo', { exact: true }).click()
    await expect(toggle).toHaveText('Ler menos')
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await card.getByText('Destinatários', { exact: true }).click()
    await expect(toggle).toHaveText('Ler mais')

    // O botão "Ler mais" não alterna duas vezes (clique do botão + clique do card).
    await toggle.click()
    await expect(toggle).toHaveText('Ler menos')
    await toggle.click()
    await expect(toggle).toHaveText('Ler mais')

    // "Resumir" abre o modal sem expandir o card.
    await card.getByRole('button', { name: 'Resumir' }).click()
    const modal = page.getByRole('dialog', { name: 'Resumo com IA' })
    await expect(modal).toBeVisible()
    await modal.getByRole('button', { name: 'Fechar' }).last().click()
    await expect(modal).toBeHidden()
    await expect(toggle).toHaveText('Ler mais')

    // Selecionar um trecho do conteúdo (para copiar) não alterna o card.
    const texto = card.locator('p.whitespace-pre-line')
    const box = (await texto.boundingBox())!
    await page.mouse.move(box.x + 2, box.y + 4)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width / 2, box.y + 4, { steps: 5 })
    await page.mouse.up()
    await expect(toggle).toHaveText('Ler mais')

    // O link do processo continua levando aos detalhes.
    await card.getByRole('link').first().click()
    await expect(page).toHaveURL(/\/processos\/\d{20}/)
  })

  test('modal "Resumo com IA" abre, mostra o resumo e fecha', async ({ page }) => {
    await page.getByRole('button', { name: 'Resumir' }).first().click()
    const modal = page.getByRole('dialog', { name: 'Resumo com IA' })
    await expect(modal).toBeVisible()
    await expect(modal.getByText('Resumo automático')).toBeVisible()
    await modal.getByRole('button', { name: 'Fechar' }).last().click()
    await expect(modal).toBeHidden()
  })

  test('avatar mostra as iniciais do usuário', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Menu do usuário/ })).toContainText('UD')
  })
})
