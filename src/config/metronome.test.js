import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { getRhythm, RHYTHMS } from './metronome.js'

const source = readFileSync(new URL('../../public/metronome-processor.js', import.meta.url), 'utf8')

function createProcessor() {
  let Processor
  const context = vm.createContext({
    AudioWorkletProcessor: class { port = { onmessage: null } },
    currentFrame: 0,
    sampleRate: 8000,
    registerProcessor: (_name, implementation) => { Processor = implementation },
  })
  vm.runInContext(source, context)
  return { processor: new Processor(), context }
}

const settings = (rhythm) => ({
  type: 'settings', bpm: 120, beatsPerBar: 4,
  rhythmBeats: rhythm.beats, rhythmDivisions: rhythm.divisions,
  wave: 'sine', frequency: 920, accent: 1320,
  duration: 0.025, pulseVolume: 0.34, accentFirstBeat: true, playing: true,
})

test('El ritmo predeterminado y los identificadores son válidos', () => {
  assert.equal(getRhythm('invalid').id, 'quarter')
  assert.equal(getRhythm('triplet').id, 'quarter')
  assert.deepEqual(RHYTHMS.map(({ id }) => id), [
    'half', 'quarter', 'eighth', 'sixteenth',
  ])
  assert.equal(new Set(RHYTHMS.map(({ id }) => id)).size, RHYTHMS.length)
})

for (const { rhythm, beatsPerBar } of RHYTHMS.flatMap((rhythm) => [3, 4, 6].map((beatsPerBar) => ({ rhythm, beatsPerBar })))) {
  test(`${rhythm.label} en ${beatsPerBar}/4: duración y acento en cada compás`, () => {
    const { processor, context } = createProcessor()
    processor.port.onmessage({ data: { ...settings(rhythm), beatsPerBar } })
    const pulsesPerBar = Math.ceil(beatsPerBar * rhythm.divisions / rhythm.beats)
    const starts = []
    let previousIndex = 0
    for (let frame = 0; frame < 96000; frame += 128) {
      context.currentFrame = frame
      processor.process([], [[new Float32Array(128)]])
      if (processor.pulseIndex !== previousIndex) {
        const index = processor.pulseIndex - 1
        starts.push(processor.pulse.start)
        const accented = index % pulsesPerBar === 0
        assert.equal(processor.pulse.frequency, accented ? 1320 : 920)
        previousIndex = processor.pulseIndex
      }
    }
    assert.ok(starts.length >= 4)
    starts.forEach((start, index) => {
      const bar = Math.floor(index / pulsesPerBar)
      const beatInBar = (index % pulsesPerBar) * rhythm.beats / rhythm.divisions
      const expected = 400 + 4000 * (bar * beatsPerBar + beatInBar)
      assert.ok(Math.abs(start - expected) <= 1)
    })
  })
}

test('Cambiar de figura reinicia el patrón y desactivar el acento respeta el ajuste', () => {
  const { processor, context } = createProcessor()
  processor.port.onmessage({ data: settings(getRhythm('sixteenth')) })
  processor.process([], [[new Float32Array(1024)]])
  context.currentFrame = 1024
  processor.port.onmessage({ data: { ...settings(getRhythm('eighth')), accentFirstBeat: false } })
  assert.equal(processor.pulseIndex, 0)
  processor.process([], [[new Float32Array(512)]])
  assert.equal(processor.pulse.frequency, 920)
})
