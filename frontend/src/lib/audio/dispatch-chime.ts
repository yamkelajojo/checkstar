'use client'

export class DispatchChime {
  private ctx: AudioContext | null = null
  private unlocked = false

  unlock() {
    if (this.unlocked) return
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      if (this.ctx.state === 'suspended') {
        this.ctx.resume()
      }
      this.unlocked = true
    } catch {
      // Audio not supported
    }
  }

  play() {
    if (!this.ctx || !this.unlocked) return

    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.connect(gain)
    gain.connect(this.ctx.destination)

    // C5 → E5 → G5 → C6 arpeggio
    osc.frequency.setValueAtTime(523.25, now)
    osc.frequency.setValueAtTime(659.25, now + 0.08)
    osc.frequency.setValueAtTime(783.99, now + 0.16)
    osc.frequency.setValueAtTime(1046.50, now + 0.24)

    gain.gain.setValueAtTime(0.15, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4)

    osc.start(now)
    osc.stop(now + 0.4)
  }

  dispose() {
    this.ctx?.close()
    this.ctx = null
    this.unlocked = false
  }
}

let instance: DispatchChime | null = null

export function getDispatchChime(): DispatchChime {
  if (!instance) {
    instance = new DispatchChime()
  }
  return instance
}
