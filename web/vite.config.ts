/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

// Porta 3099: a 3000 já é usada em outros projetos locais.
const PORT = 3099

/**
 * Os mesmos cabeçalhos de segurança da Vercel (vercel.json) no `vite preview`,
 * para o Playwright rodar a suíte inteira sob a CSP de produção. Só o
 * connect-src troca a API de produção pela API local dos testes.
 */
function productionHeaders(): Record<string, string> {
  type VercelConfig = { headers: { headers: { key: string; value: string }[] }[] }
  const vercel = JSON.parse(readFileSync(new URL('./vercel.json', import.meta.url), 'utf8')) as VercelConfig
  const api = new URL(process.env.VITE_API_URL ?? 'http://localhost:8888').origin
  return Object.fromEntries(
    vercel.headers[0].headers.map(({ key, value }) => [
      key,
      key === 'Content-Security-Policy' ? value.replace(/connect-src [^;]+/, `connect-src 'self' ${api}`) : value,
    ]),
  )
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  // As páginas são carregadas sob demanda; sem esta lista o Vite só descobre
  // estas dependências depois e reotimiza no meio da sessão (React duplicado).
  optimizeDeps: {
    include: ['react-hook-form', '@hookform/resolvers/zod', 'zod', 'lucide-react'],
  },
  server: { port: PORT, strictPort: true },
  // Vitest: só testes unitários em src/; e2e/ é do Playwright (npm run test:e2e).
  test: { include: ['src/**/*.test.{ts,tsx}'] },
  preview: { port: PORT, strictPort: true, headers: productionHeaders() },
})
