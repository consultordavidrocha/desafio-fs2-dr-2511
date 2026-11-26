#!/usr/bin/env node
/**
 * Trava contra "arquivo obeso": falha se algum arquivo de código versionado
 * passar de MAX_LINES linhas. Arquivo grande demais costuma misturar
 * responsabilidades — o limite força quebrar em módulos menores.
 *
 * Uso: node scripts/check-file-size.mjs [limite]   (padrão: 500)
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const MAX_LINES = Number(process.argv[2] ?? 500);
const CODE = /\.(ts|tsx|js|jsx|mjs|cjs|css|prisma|py|sql)$/;
// Gerados ou de dados: não são código escrito à mão.
const IGNORED = [/(^|\/)migrations\//, /package-lock\.json$/, /\.d\.ts$/, /^docs\//];

const files = execFileSync('git', ['ls-files'], { encoding: 'utf8' })
  .split('\n')
  .filter((file) => CODE.test(file) && !IGNORED.some((rule) => rule.test(file)));

const sizes = files
  .map((file) => ({ file, lines: readFileSync(file, 'utf8').split('\n').length }))
  .sort((a, b) => b.lines - a.lines);

const tooBig = sizes.filter(({ lines }) => lines > MAX_LINES);

console.log(`Arquivos de código verificados: ${sizes.length} (limite: ${MAX_LINES} linhas)`);
console.log('Maiores:');
for (const { file, lines } of sizes.slice(0, 5)) console.log(`  ${String(lines).padStart(4)}  ${file}`);

if (tooBig.length) {
  console.error(`\n${tooBig.length} arquivo(s) acima de ${MAX_LINES} linhas — quebre em módulos menores:`);
  for (const { file, lines } of tooBig) console.error(`  ${lines}  ${file}`);
  process.exit(1);
}
console.log('\nOK: nenhum arquivo acima do limite.');
