import { config } from 'dotenv';
import { resolve } from 'node:path';

/**
 * Os testes e2e usam o banco `juscash_test` (definido em .env.test), nunca o
 * banco de desenvolvimento: eles apagam dados entre um teste e outro.
 */
config({
  path: resolve(__dirname, '../../.env.test'),
  override: true,
  quiet: true,
});
