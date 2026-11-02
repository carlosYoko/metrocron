import { networkInterfaces } from 'node:os'
import { spawn } from 'node:child_process'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const port = 5173
const addresses = Object.values(networkInterfaces())
  .flatMap((interfaces) => interfaces ?? [])
  .filter((network) => network.family === 'IPv4' && !network.internal && !network.address.startsWith('169.254.'))
  .map((network) => network.address)

console.log('Iniciando el servidor de desarrollo para móvil.')
if (addresses.length === 0) {
  console.warn('No se detectaron direcciones IPv4 de red. Comprueba la conexión y vuelve a ejecutar el comando.')
}
console.log('Cuando Vite esté listo, abre en el móvil una dirección Network: http://... conectada a la misma Wi-Fi.')

const vitePath = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url))
const server = spawn(process.execPath, [vitePath, '--host', '0.0.0.0', '--port', String(port)], {
  stdio: 'inherit',
})

server.on('error', (error) => {
  console.error('No se pudo iniciar Vite.', error)
  process.exitCode = 1
})

server.on('exit', (code) => {
  process.exitCode = code ?? 0
})
