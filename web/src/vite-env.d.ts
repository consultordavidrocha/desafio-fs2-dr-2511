/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL base da API, ex.: http://localhost:8888 */
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
