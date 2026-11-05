// Convierte el instante del reloj de audio al momento en que se oye en la salida.
export function getVisualDelay(context, audioTime, now) {
  const timestamp = context.getOutputTimestamp?.()
  if (timestamp?.contextTime > 0 && timestamp.performanceTime > 0) {
    const outputTime = timestamp.performanceTime + (audioTime - timestamp.contextTime) * 1000
    return Math.max(0, outputTime - now)
  }

  const latency = (context.baseLatency || 0) + (context.outputLatency || 0)
  return Math.max(0, (audioTime - context.currentTime + latency) * 1000)
}
