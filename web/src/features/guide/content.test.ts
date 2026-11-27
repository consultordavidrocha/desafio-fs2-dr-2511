/// <reference types="node" />
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { BLOCKS, EXTRAS, PRODUCTION_LINKS, PROBLEMS, RUN_LOCALLY, repoFile, repoTree } from './content'

/**
 * O guia é público: um link quebrado é a primeira coisa que o avaliador vê.
 * Confere que cada link para o repositório aponta para um arquivo/pasta
 * versionado e que cada âncora existe no Markdown de destino.
 */
const ROOT = fileURLToPath(new URL('../../../../', import.meta.url))
const BLOB = repoFile('')
const TREE = repoTree('')
const versioned = execSync('git ls-files', { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean)

/** Âncoras que o GitHub gera para os títulos de um Markdown (com sufixo -1, -2 nos repetidos). */
function githubAnchors(markdown: string): Set<string> {
  const anchors = new Set<string>()
  const seen = new Map<string, number>()
  let inFence = false
  for (const line of markdown.split('\n')) {
    if (line.startsWith('```')) inFence = !inFence
    const heading = !inFence && /^#{1,6} (.*)$/.exec(line)
    if (!heading) continue
    const base = heading[1]
      .trim()
      .replace(/[`*]/g, '')
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\- _]/gu, '')
      .replace(/ /g, '-')
    const n = seen.get(base) ?? 0
    seen.set(base, n + 1)
    anchors.add(n === 0 ? base : `${base}-${n}`)
  }
  return anchors
}

const allLinks = [
  ...PRODUCTION_LINKS.map((l) => l.href),
  ...BLOCKS.flatMap((b) => b.links.map((l) => l.href)),
  ...EXTRAS.map((e) => e.href),
  ...PROBLEMS.flatMap((p) => [repoFile('RESPOSTAS.md', p.answerAnchor), ...(p.material ? [repoTree(p.material)] : [])]),
  RUN_LOCALLY,
  repoTree('problemas'),
]

describe('links do Guia do avaliador', () => {
  it('só aponta para endereços públicos (https), nunca para arquivos locais', () => {
    for (const href of allLinks) expect(href).toMatch(/^https:\/\//)
  })

  it('cada arquivo do repositório citado está versionado', () => {
    for (const href of allLinks.filter((h) => h.startsWith(BLOB))) {
      const path = decodeURIComponent(href.slice(BLOB.length).split('#')[0])
      expect(versioned, href).toContain(path)
    }
  })

  it('cada pasta do repositório citada tem arquivos versionados', () => {
    for (const href of allLinks.filter((h) => h.startsWith(TREE))) {
      const dir = href.slice(TREE.length)
      expect(versioned.some((f) => f.startsWith(`${dir}/`)), href).toBe(true)
    }
  })

  it('cada âncora existe no Markdown de destino', () => {
    for (const href of allLinks.filter((h) => h.startsWith(BLOB) && h.includes('#'))) {
      const [path, anchor] = href.slice(BLOB.length).split('#')
      const anchors = githubAnchors(readFileSync(`${ROOT}${path}`, 'utf8'))
      expect([...anchors], href).toContain(anchor)
    }
  })
})
