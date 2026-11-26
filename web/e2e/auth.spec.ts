import { expect, test } from '@playwright/test'
import { DEMO, login, uniqueEmail } from './support'

test.describe('Autenticação', () => {
  test('rota protegida sem sessão redireciona para o login e volta depois de entrar', async ({ page }) => {
    await page.goto('/processos/26222501320248190546')
    await expect(page).toHaveURL(/\/login$/)

    await page.getByLabel('E-mail').fill(DEMO.email)
    await page.getByLabel('Senha', { exact: true }).fill(DEMO.password)
    await page.getByRole('button', { name: 'Entrar' }).click()

    await expect(page).toHaveURL(/\/processos\/26222501320248190546$/)
    await expect(page.getByText('Detalhes do processo')).toBeVisible()
  })

  test('login com senha errada mostra a mensagem do Figma e marca os campos', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('E-mail').fill(DEMO.email)
    await page.getByLabel('Senha', { exact: true }).fill('senhaErrada99')
    await page.getByRole('button', { name: 'Entrar' }).click()

    await expect(page.getByRole('alert')).toContainText('E-mail ou senha incorretos')
    await expect(page.getByLabel('E-mail')).toHaveAttribute('aria-invalid', 'true')
    await expect(page.getByLabel('Senha', { exact: true })).toHaveAttribute('aria-invalid', 'true')
  })

  test('mostrar/ocultar senha', async ({ page }) => {
    await page.goto('/login')
    const senha = page.getByLabel('Senha', { exact: true })
    await senha.fill('qualquer123')
    await expect(senha).toHaveAttribute('type', 'password')

    await page.getByRole('button', { name: 'Mostrar senha' }).click()
    await expect(senha).toHaveAttribute('type', 'text')
    await page.getByRole('button', { name: 'Ocultar senha' }).click()
    await expect(senha).toHaveAttribute('type', 'password')
  })

  test('cadastro valida e-mail, tamanho da senha e confirmação (mensagens do Figma)', async ({ page }) => {
    await page.goto('/cadastro')
    await page.getByLabel('Nome completo').fill('Teste E2E')
    await page.getByLabel('E-mail').fill('email@')
    await page.getByLabel('Senha', { exact: true }).fill('123')
    await page.getByLabel('Confirme sua senha').fill('456')
    await page.getByRole('button', { name: 'Criar conta' }).click()

    await expect(page.getByText('Informe um e-mail válido.')).toBeVisible()
    await expect(page.getByText('A senha deve ter no mínimo 8 caracteres.')).toBeVisible()

    await page.getByLabel('E-mail').fill('ok@exemplo.com')
    await page.getByLabel('Senha', { exact: true }).fill('senhaSegura123')
    await page.getByRole('button', { name: 'Criar conta' }).click()
    await expect(page.getByText('As senhas não coincidem.')).toBeVisible()
    await expect(page).toHaveURL(/\/cadastro$/)
  })

  test('cadastro cria a conta, entra direto com as iniciais no avatar e recusa e-mail repetido', async ({ page }) => {
    const email = uniqueEmail('e2e.cadastro')
    await page.goto('/cadastro')
    await page.getByLabel('Nome completo').fill('Marina de Souza Lima')
    await page.getByLabel('E-mail').fill(email)
    await page.getByLabel('Senha', { exact: true }).fill('senhaSegura123')
    await page.getByLabel('Confirme sua senha').fill('senhaSegura123')
    await page.getByRole('button', { name: 'Criar conta' }).click()

    await expect(page).toHaveURL(/\/comunicacoes$/)
    await expect(page.getByRole('button', { name: /Menu do usuário/ })).toContainText('ML')

    // Sair e tentar cadastrar o mesmo e-mail (com outra caixa): 409 no campo.
    await page.getByRole('button', { name: /Menu do usuário/ }).click()
    await page.getByRole('menuitem', { name: 'Sair' }).click()
    await page.goto('/cadastro')
    await page.getByLabel('Nome completo').fill('Outra Pessoa')
    await page.getByLabel('E-mail').fill(email.toUpperCase())
    await page.getByLabel('Senha', { exact: true }).fill('senhaSegura123')
    await page.getByLabel('Confirme sua senha').fill('senhaSegura123')
    await page.getByRole('button', { name: 'Criar conta' }).click()
    await expect(page.getByText('Este e-mail já está cadastrado.')).toBeVisible()
  })

  test('sessão sobrevive ao recarregar; sair volta ao login; logado, /login redireciona', async ({ page }) => {
    await login(page)
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Comunicações' })).toBeVisible()

    await page.goto('/login')
    await expect(page).toHaveURL(/\/comunicacoes$/)

    await page.getByRole('button', { name: /Menu do usuário/ }).click()
    await expect(page.getByRole('menu')).toContainText(DEMO.email)
    await page.getByRole('menuitem', { name: 'Sair' }).click()
    await expect(page).toHaveURL(/\/login$/)
    await page.goto('/comunicacoes')
    await expect(page).toHaveURL(/\/login$/)
  })
})
