// Sonda de segurança: mede no ambiente o que a auditoria (docs/auditoria-seguranca.md) concluiu.
// Só leituras e requisições inválidas: NÃO cria dados (o cadastro com campos extras é recusado
// pela whitelist antes de gravar). Esgota o rate limit de login do seu IP por ~1 minuto.
//
// Uso:   node scripts/auditoria/sonda-seguranca.mjs                  (produção)
//        API=http://localhost:8888 WEB=http://localhost:3099 node scripts/auditoria/sonda-seguranca.mjs
// Saída: ✅ passou · ❌ falhou · ⚪ inconclusivo (ex.: barrado antes, na Cloudflare) · ℹ️ informativo.
// Código de saída 1 se algum ❌.
import { createHmac, randomBytes } from 'node:crypto'

const API = process.env.API ?? 'https://juscash-api-3xep.onrender.com'
const WEB = process.env.WEB ?? 'https://desafio-fs2-dr-2511.vercel.app'
const DEMO = { email: 'demo@exemplo.com', password: 'demo12345' }
const out = []
const log = (area, teste, esperado, obtido, ok) => out.push({ area, teste, esperado, obtido, ok })

async function req(path, { method = 'GET', headers = {}, body, raw } = {}) {
  const r = await fetch(API + path, {
    method,
    headers: { ...(body !== undefined || raw ? { 'content-type': 'application/json' } : {}), ...headers },
    body: raw ?? (body !== undefined ? JSON.stringify(body) : undefined),
  })
  const text = await r.text()
  return { status: r.status, headers: r.headers, text }
}
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url')

// --- Cabeçalhos
for (const [nome, url] of [['API', API + '/live'], ['Front', WEB + '/']]) {
  const r = await fetch(url)
  const h = Object.fromEntries(r.headers)
  const faltando = ['x-content-type-options', 'x-frame-options', 'content-security-policy', 'referrer-policy']
    .filter((k) => !h[k])
  if (url.startsWith('https:') && !h['strict-transport-security']) faltando.push('strict-transport-security')
  const ok = faltando.length === 0 && !h['x-powered-by']
  log('Headers', `${nome} cabeçalhos de segurança`, 'nosniff, anti-frame, CSP, Referrer-Policy, HSTS; sem x-powered-by',
    ok ? 'todos presentes' : `faltando: ${faltando.join(', ') || '-'}${h['x-powered-by'] ? ` · x-powered-by: ${h['x-powered-by']}` : ''}`, ok)
}

// --- Token de controle (credencial forte)
const login = await req('/auth/login', { method: 'POST', body: DEMO })
const token = JSON.parse(login.text).accessToken
log('Auth', 'login demo (controle)', '200 + token', `${login.status} ${token ? 'token' : 'sem token'}`, login.status === 200 && !!token)
const auth = { authorization: `Bearer ${token}` }
const [, payloadB64] = token.split('.')
const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString())
log('Auth', 'conteúdo do JWT', 'só sub/email/name/iat/exp, sem senha/hash', Object.keys(payload).join(','), !('password' in payload) && !('passwordHash' in payload))

// --- Rotas protegidas: sem token × com token
const firstId = JSON.parse((await req('/comunicacoes?pageSize=1', { headers: auth })).text).data[0].id
const protegidas = [
  ['GET', '/comunicacoes'], ['GET', '/processos/26222501320248190546'], ['GET', '/auth/me'],
  ['POST', `/comunicacoes/${firstId}/resumo`],
]
for (const [method, path] of protegidas) {
  const fraca = await req(path, { method })
  const forte = await req(path, { method, headers: auth })
  const veredito = forte.status < 300 && fraca.status === 401 ? 'PROTEGIDO' : fraca.status < 300 ? 'ABERTO' : 'INCONCLUSIVO'
  log('Autorização', `${method} ${path}`, 'sem token 401 / com token 2xx', `${fraca.status} / ${forte.status} → ${veredito}`, veredito === 'PROTEGIDO')
}

// --- JWT forjado
const now = Math.floor(Date.now() / 1000)
const forjados = {
  'alg none': `${b64({ alg: 'none', typ: 'JWT' })}.${b64({ ...payload })}.`,
  'assinado com segredo errado': (() => {
    const h = b64({ alg: 'HS256', typ: 'JWT' }), p = b64({ ...payload, exp: now + 3600 })
    return `${h}.${p}.${createHmac('sha256', randomBytes(32)).update(`${h}.${p}`).digest('base64url')}`
  })(),
  'payload alterado (assinatura original)': `${token.split('.')[0]}.${b64({ ...payload, sub: 'outro-usuario', exp: now + 99999 })}.${token.split('.')[2]}`,
  'lixo': 'abc.def.ghi',
  'esquema Basic': null,
}
for (const [nome, t] of Object.entries(forjados)) {
  const headers = t === null ? { authorization: `Basic ${Buffer.from('a:b').toString('base64')}` } : { authorization: `Bearer ${t}` }
  const r = await req('/auth/me', { headers })
  log('JWT', nome, '401', String(r.status), r.status === 401)
}

// --- Injeção / validação (com token válido)
const injecoes = [
  ["numeroProcesso SQLi", "/comunicacoes?numeroProcesso=' OR 1=1--"],
  ["tribunal SQLi", "/comunicacoes?tribunal=TJSP' OR '1'='1"],
  ["dataInicio SQLi", "/comunicacoes?dataInicio=2025-01-01'; DROP TABLE users;--"],
  ['pageSize 1000', '/comunicacoes?pageSize=1000'],
  ['page negativa', '/comunicacoes?page=-1'],
  ['page gigante', '/comunicacoes?page=99999999999999999999'],
  ['parâmetro extra', '/comunicacoes?admin=true'],
  ['parâmetro duplicado', '/comunicacoes?tribunal=TJSP&tribunal=TJRJ'],
  ['processo SQLi', "/processos/' OR 1=1 --"],
  ['processo path traversal', '/processos/..%2F..%2F..%2Fetc%2Fpasswd'],
  ['resumo id não numérico', '/comunicacoes/abc/resumo'],
  ['resumo id inexistente', '/comunicacoes/999999999/resumo'],
]
for (const [nome, path] of injecoes) {
  const method = path.includes('/resumo') ? 'POST' : 'GET'
  const r = await req(path, { method, headers: auth })
  // 403 em HTML = o WAF da Cloudflare (na frente do Render) barrou antes da API: não prova
  // nada sobre a API. Rode também contra a API local para medir a validação dela.
  const borda = r.status === 403 && /^\s*<!DOCTYPE/i.test(r.text)
  const vaza = /prisma|stack|at \w+ \(|\.ts:\d+|postgres/i.test(r.text)
  const ok = borda ? null : r.status >= 400 && r.status < 500 && !vaza
  log('Entrada', nome, '4xx sem vazar detalhe interno', borda ? '403 da Cloudflare (barrado na borda)' : `${r.status}${vaza ? ' VAZA' : ''} ${r.text.slice(0, 90)}`, ok)
}

// --- Corpo malformado / gigante (antes do rate limit)
const malformado = await req('/auth/login', { method: 'POST', raw: '{"email": ' })
log('Entrada', 'JSON malformado', '400 sem stack', `${malformado.status} ${malformado.text.slice(0, 90)}`, malformado.status === 400 && !/at \w+ \(/.test(malformado.text))
const gigante = await req('/auth/login', { method: 'POST', raw: JSON.stringify({ email: 'a@a.com', password: 'x'.repeat(2_000_000) }) })
log('Entrada', 'corpo de 2 MB', '413', String(gigante.status), gigante.status === 413)

// --- CORS
for (const [origem, deve] of [['https://evil.example', false], [WEB, true]]) {
  const r = await fetch(API + '/auth/login', { method: 'OPTIONS', headers: { origin: origem, 'access-control-request-method': 'POST', 'access-control-request-headers': 'content-type' } })
  const acao = r.headers.get('access-control-allow-origin')
  log('CORS', `preflight de ${origem}`, deve ? 'liberado' : 'bloqueado', `${r.status} ACAO=${acao}`, deve ? acao === origem : !acao)
}

// --- Login: enumeração e mass assignment (consome o rate limit de propósito, por último)
const semEmail = await req('/auth/login', { method: 'POST', body: { email: `naoexiste.${Date.now()}@exemplo.com`, password: 'senhaerrada1' } })
const senhaErrada = await req('/auth/login', { method: 'POST', body: { email: DEMO.email, password: 'senhaerrada1' } })
log('Auth', 'mensagem: e-mail inexistente × senha errada', 'idênticas', `${semEmail.status} ${semEmail.text === senhaErrada.text ? 'idênticas' : 'DIFERENTES'}`, semEmail.text === senhaErrada.text)
const extra = await req('/auth/cadastro', { method: 'POST', body: { name: 'X', email: `x.${Date.now()}@exemplo.com`, password: 'senha1234', role: 'admin', id: 'fixo' } })
log('Entrada', 'cadastro com campos extras (role/id)', '400 (whitelist) — e nada criado', `${extra.status} ${extra.text.slice(0, 90)}`, extra.status === 400)

const statuses = []
for (let i = 0; i < 6; i++) statuses.push((await req('/auth/login', { method: 'POST', body: { email: DEMO.email, password: 'senhaerrada1' } })).status)
log('Rate limit', 'logins seguidos', 'corta com 429 antes de 8 tentativas', statuses.join(','), statuses.includes(429))

// --- Front: segredos no bundle e source maps
const html = await (await fetch(WEB + '/')).text()
const scripts = [...html.matchAll(/src="(\/assets\/[^"]+\.js)"/g)].map((m) => m[1])
if (!scripts.length) throw new Error('nenhum script encontrado no index.html (rode contra um build, não o dev server)')
let bundle = ''
for (const s of scripts) bundle += await (await fetch(WEB + s)).text()
const suspeitos = (bundle.match(/(npg_|postgres(ql)?:\/\/|JWT_SECRET|DATABASE_URL|figd_|ghp_)/g) ?? [])
log('Front', 'segredos no bundle JS', 'nenhum', suspeitos.length ? suspeitos.join(',') : 'nenhum', suspeitos.length === 0)
const map = await fetch(WEB + scripts[0] + '.map')
log('Front', 'source map público', 'não (ou decisão consciente)', `${map.status} ${map.headers.get('content-type')}`, map.status !== 200 || !/json/.test(map.headers.get('content-type') ?? ''))
const docs = await fetch(API + '/docs')
log('Superfície', 'Swagger /docs em produção', 'informativo', String(docs.status), null)

for (const l of out) {
  const icone = l.ok === null ? (l.area === 'Entrada' ? '⚪' : 'ℹ️ ') : l.ok ? '✅' : '❌'
  console.log(`${icone} [${l.area}] ${l.teste} — esperado: ${l.esperado} — obtido: ${l.obtido}`)
}
const falhas = out.filter((l) => l.ok === false).length
console.log(`
${out.filter((l) => l.ok).length} passaram · ${falhas} falharam · ${out.filter((l) => l.ok === null).length} inconclusivos/informativos`)
process.exitCode = falhas ? 1 : 0
