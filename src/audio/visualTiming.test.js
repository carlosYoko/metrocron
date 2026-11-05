import test from 'node:test'
import assert from 'node:assert/strict'
import { getVisualDelay } from './visualTiming.js'

test('El timestamp de salida compensa el retraso sin sumar la latencia dos veces', () => {
  const context = {
    currentTime: 10.1, baseLatency: 0.02, outputLatency: 0.08,
    getOutputTimestamp: () => ({ contextTime: 10, performanceTime: 5000 }),
  }
  assert.ok(Math.abs(getVisualDelay(context, 10.2, 5050) - 150) < 0.001)
  assert.equal(getVisualDelay(context, 9, 5050), 0)
})

test('Sin timestamp válido se usa la latencia estimada por el navegador', () => {
  const context = { currentTime: 10, baseLatency: 0.02, outputLatency: 0.08 }
  assert.ok(Math.abs(getVisualDelay(context, 10, 5000) - 100) < 0.001)
  context.getOutputTimestamp = () => ({ contextTime: 0, performanceTime: 0 })
  assert.ok(Math.abs(getVisualDelay(context, 10, 5000) - 100) < 0.001)
})

test('Sin APIs de latencia se mantiene la planificación de audio básica', () => {
  assert.equal(getVisualDelay({ currentTime: 1 }, 1.25, 5000), 250)
})
