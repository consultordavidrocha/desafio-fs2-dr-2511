import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

// Porta 3099: a 3000 já é usada em outros projetos locais.
const PORT = 3099

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
  preview: { port: PORT, strictPort: true },
})
