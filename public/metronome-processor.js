class MetrocronAudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this.bpm = 84
    this.beatsPerBar = 4
    this.wave = 'triangle'
    this.frequency = 920
    this.accent = 1320
    this.duration = 0.045
    this.pulseVolume = 0.34
    this.accentFirstBeat = true
    this.playing = false
    this.beat = 0
    this.nextBeatFrame = currentFrame
    this.pulse = null
    this.timerAlarmFrame = null
    this.alarmStartFrame = null

    this.port.onmessage = ({ data }) => {
      if (data.type === 'settings') {
        const wasPlaying = this.playing
        this.bpm = data.bpm
        this.beatsPerBar = data.beatsPerBar
        this.wave = data.wave
        this.frequency = data.frequency
        this.accent = data.accent
        this.duration = data.duration
        this.pulseVolume = data.pulseVolume
        this.accentFirstBeat = data.accentFirstBeat
        this.playing = data.playing
        if (this.playing && !wasPlaying) {
          this.beat = 0
          this.nextBeatFrame = currentFrame
        }
      } else if (data.type === 'schedule-alarm') {
        this.timerAlarmFrame = currentFrame + Math.max(0, data.seconds) * sampleRate
      } else if (data.type === 'cancel-alarm') {
        this.timerAlarmFrame = null
      } else if (data.type === 'play-alarm') {
        this.alarmStartFrame = currentFrame
      }
    }
  }

  oscillatorSample(phase) {
    if (this.wave === 'square') return Math.sin(phase) >= 0 ? 1 : -1
    if (this.wave === 'triangle') return (2 / Math.PI) * Math.asin(Math.sin(phase))
    return Math.sin(phase)
  }

  process(_inputs, outputs) {
    const output = outputs[0][0]
    output.fill(0)

    for (let index = 0; index < output.length; index += 1) {
      const frame = currentFrame + index

      if (this.timerAlarmFrame !== null && frame >= this.timerAlarmFrame) {
        this.alarmStartFrame = frame
        this.timerAlarmFrame = null
      }

      if (this.playing && frame >= this.nextBeatFrame) {
        const isAccent = this.accentFirstBeat && this.beat === 0
        this.pulse = {
          start: frame,
          frequency: isAccent ? this.accent : this.frequency,
          volume: this.pulseVolume * (isAccent ? 1 : 0.72),
        }
        this.beat = (this.beat + 1) % this.beatsPerBar
        this.nextBeatFrame += sampleRate * (60 / this.bpm)
      }

      if (this.pulse) {
        const elapsed = frame - this.pulse.start
        const length = this.duration * sampleRate
        if (elapsed >= length) this.pulse = null
        else {
          const phase = (2 * Math.PI * this.pulse.frequency * elapsed) / sampleRate
          output[index] += this.oscillatorSample(phase) * this.pulse.volume * Math.exp(-6 * elapsed / length)
        }
      }

      if (this.alarmStartFrame !== null) {
        const elapsed = (frame - this.alarmStartFrame) / sampleRate
        const notes = [
          { frequency: 659.25, offset: 0, duration: 0.3 },
          { frequency: 783.99, offset: 0.3, duration: 0.3 },
          { frequency: 1046.5, offset: 0.6, duration: 0.65 },
        ]
        let alarmSample = 0
        notes.forEach(({ frequency, offset, duration }) => {
          const noteElapsed = elapsed - offset
          if (noteElapsed >= 0 && noteElapsed < duration) {
            const envelope = Math.min(1, noteElapsed / 0.025) * Math.exp(-5 * noteElapsed / duration)
            alarmSample += Math.sin(2 * Math.PI * frequency * noteElapsed) * 0.24 * envelope
          }
        })
        output[index] += alarmSample
        if (elapsed >= 1.25) this.alarmStartFrame = null
      }
    }

    return true
  }
}

registerProcessor('metrocron-audio', MetrocronAudioProcessor)
