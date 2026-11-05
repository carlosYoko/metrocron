import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'

const source = readFileSync(new URL('../../public/sw.js', import.meta.url), 'utf8')

function loadWorker(caches) {
  const handlers = {}
  const context = vm.createContext({
    caches,
    // En el navegador las rutas relativas se resuelven contra el origen.
    Request: class extends Request {
      constructor(url, options) { super(new URL(url, 'https://metrocron.test'), options) }
    },
    self: {
      addEventListener: (type, handler) => { handlers[type] = handler },
      skipWaiting: async () => {},
      clients: { claim: async () => {} },
    },
  })
  vm.runInContext(source, context)
  return handlers
}

async function run(handler) {
  let pending
  handler({ waitUntil: (promise) => { pending = promise } })
  await pending
}

test('La instalación renueva el shell y precarga el bundle que incluye el audio', async () => {
  const requests = []
  const cache = {
    addAll: async (batch) => { requests.push(...batch) },
    match: async () => ({ text: async () => '<script src="/assets/app-hash.js"></script><link href="/assets/app-hash.css">' }),
  }
  const handlers = loadWorker({ open: async () => cache })
  await run(handlers.install)
  assert.ok(requests.some(({ url }) => url.endsWith('/assets/app-hash.js')))
  assert.ok(requests.every(({ cache }) => cache === 'reload'))
  assert.ok(requests.every(({ url }) => !url.endsWith('/metronome-processor.js')))
})

test('La activación elimina la caché antigua del procesador', async () => {
  const deleted = []
  const handlers = loadWorker({
    keys: async () => ['metrocron-v1', 'metrocron-v2', 'metrocron-v3', 'other-app'],
    delete: async (name) => { deleted.push(name) },
  })
  await run(handlers.activate)
  assert.deepEqual(deleted, ['metrocron-v1', 'metrocron-v2'])
})
