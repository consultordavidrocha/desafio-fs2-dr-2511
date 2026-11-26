import { defineConfig, devices } from '@playwright/test'

/**
 * Testes de ponta a ponta no navegador (Playwright), contra a stack real:
 * Postgres + API (docker compose) + front (build de produção servido pelo `vite preview`).
 *
 * Pré-requisito: `docker compose up -d --build` na raiz, com AUTH_RATE_LIMIT alto
 * (a suíte faz vários logins seguidos). Ver "Testes" no README.
 *
 * - E2E_BASE_URL: aponta para um front já no ar (sem subir o preview).
 * - Localmente usa o Chrome instalado; no CI, o Chromium do Playwright.
 */
const PORT = 3099
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`
const apiURL = process.env.VITE_API_URL ?? 'http://localhost:8888'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // os testes compartilham o mesmo banco
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  timeout: 30_000,
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], channel: process.env.CI ? undefined : 'chrome', viewport: { width: 1366, height: 768 } },
    },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        env: { VITE_API_URL: apiURL },
        timeout: 120_000,
      },
})
