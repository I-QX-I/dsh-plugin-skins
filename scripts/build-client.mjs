import { readFileSync, writeFileSync, renameSync, unlinkSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { Script } from 'node:vm'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const sourceRoot = new URL('../src/client/', import.meta.url)
const clientPath = fileURLToPath(new URL('../client.js', import.meta.url))
const marker = '/* @client-source */'

// Preserve source bytes and factory scope. No transpilation, minification,
// wrappers, runtime imports, or additional dependencies.
export function composeClient () {
  const parts = JSON.parse(readFileSync(new URL('parts.json', sourceRoot), 'utf8'))
  if (!Array.isArray(parts) || !parts.length || new Set(parts).size !== parts.length) {
    throw new Error('parts.json must contain a non-empty list of unique source files')
  }
  const template = readFileSync(new URL('runtime.template.js', sourceRoot), 'utf8')
  const split = template.split(marker)
  if (split.length !== 2) throw new Error('Runtime template must contain exactly one source marker')
  let code = split[0]
  const sections = []
  for (const name of parts) {
    if (typeof name !== 'string' || !/^[a-z][a-z-]*\.js$/.test(name)) {
      throw new Error(`Invalid client source filename: ${name}`)
    }
    const text = readFileSync(new URL(name, sourceRoot), 'utf8')
    // Complete declarations make accidental cuts visible before composition.
    new Script(text, { filename: name })
    const startLine = code.split('\n').length
    code += text
    sections.push({ file: `src/client/${name}`, startLine, endLine: code.split('\n').length - 1 })
  }
  code += split[1]
  new Script(code, { filename: 'client.js' })
  const bytes = Buffer.from(code)
  return { bytes, sections, sha256: createHash('sha256').update(bytes).digest('hex') }
}

export function assertCurrentClient () {
  const result = composeClient()
  if (!readFileSync(clientPath).equals(result.bytes)) {
    throw new Error('client.js differs from its maintenance sources. Run npm run build; edit src/client, not client.js.')
  }
  return result
}

function writeClient (path, bytes) {
  if (existsSync(path) && readFileSync(path).equals(bytes)) return false
  const temporary = `${path}.${process.pid}.tmp`
  try {
    writeFileSync(temporary, bytes, { flag: 'wx' })
    renameSync(temporary, path)
  } finally {
    if (existsSync(temporary)) unlinkSync(temporary)
  }
  return true
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2)
  if (args.some(arg => arg !== '--check' && !arg.startsWith('--out='))) {
    throw new Error('Usage: node scripts/build-client.mjs [--check | --out=path]')
  }
  if (args.length > 1) throw new Error('Specify at most one build option')
  const check = args.includes('--check')
  const result = check ? assertCurrentClient() : composeClient()
  const out = args.find(arg => arg.startsWith('--out='))?.slice(6)
  if (out === '') throw new Error('Output path must not be empty')
  const written = check ? false : writeClient(out ? resolve(out) : clientPath, result.bytes)
  console.log(JSON.stringify({ checked: check, written, bytes: result.bytes.length, sha256: result.sha256, sections: result.sections }, null, 2))
}
