import { Injectable, signal } from '@angular/core';

export type SfxName =
  | 'deal'
  | 'click'
  | 'heal'
  | 'waste'
  | 'equip'
  | 'hitWeapon'
  | 'hitHands'
  | 'block'
  | 'run'
  | 'win'
  | 'lose';

interface OscOptions {
  type?: OscillatorType;
  freq: number;
  t: number;
  dur: number;
  vol?: number;
  slideTo?: number | null;
  detune?: number;
}

interface NoiseOptions {
  t: number;
  dur: number;
  vol?: number;
  filter?: BiquadFilterType;
  freq?: number;
  freqEnd?: number | null;
  q?: number;
}

const STORAGE_KEY = 'scoundrel.audio';
const VOLUME = { music: 0.16, sfx: 0.5 } as const;

const BPM = 92;
const EIGHTH = 60 / BPM / 2;
const SWING = EIGHTH * 0.14;
/** Progressão lo-fi: Fmaj7 → G7 → Em7 → Am7 (MIDI). */
const BARS = [
  { bass: 41, chord: [53, 57, 60, 64] },
  { bass: 43, chord: [55, 59, 62, 65] },
  { bass: 40, chord: [52, 55, 59, 62] },
  { bass: 45, chord: [57, 60, 64, 67] },
] as const;

/**
 * Efeitos sonoros e trilha lo-fi, 100% sintetizados via Web Audio API.
 * Não conhece o jogo: apenas expõe `play(nome)` e controles de música.
 */
@Injectable({ providedIn: 'root' })
export class AudioService {
  private ctx: AudioContext | null = null;
  private sfxGain!: GainNode;
  private musicGain!: GainNode;
  private noiseBuffer!: AudioBuffer;
  private musicTimer: ReturnType<typeof setInterval> | null = null;
  private step = 0;
  private nextTime = 0;

  private readonly _musicOn = signal(true);
  private readonly _sfxOn = signal(true);
  readonly musicOn = this._musicOn.asReadonly();
  readonly sfxOn = this._sfxOn.asReadonly();

  constructor() {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    if (typeof stored.music === 'boolean') this._musicOn.set(stored.music);
    if (typeof stored.sfx === 'boolean') this._sfxOn.set(stored.sfx);
  }

  /** Deve ser chamado a partir de um gesto do usuário (política de autoplay). */
  unlock(): void {
    this.ensureCtx();
    if (this._musicOn()) this.startMusic();
  }

  play(name: SfxName, delayMs = 0): void {
    if (!this._sfxOn() || !this.ctx) return;
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    this.sfx[name](this.ctx.currentTime + delayMs / 1000 + 0.001);
  }

  setMusic(on: boolean): void {
    this._musicOn.set(on);
    this.persist();
    if (!this.ctx) return;
    if (on) this.startMusic();
    else this.stopMusic();
  }

  setSfx(on: boolean): void {
    this._sfxOn.set(on);
    this.persist();
  }

  /** Abaixa a música por `sec` segundos (jingles de fim de jogo). */
  duckMusic(sec = 4): void {
    if (!this.ctx || !this.musicTimer) return;
    const now = this.ctx.currentTime;
    const gain = this.musicGain.gain;
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(gain.value, now);
    gain.exponentialRampToValueAtTime(VOLUME.music * 0.2, now + 0.4);
    gain.setValueAtTime(VOLUME.music * 0.2, now + sec);
    gain.exponentialRampToValueAtTime(VOLUME.music, now + sec + 1.2);
  }

  // ---------- Infraestrutura ----------

  private persist(): void {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ music: this._musicOn(), sfx: this._sfxOn() }),
    );
  }

  private ensureCtx(): void {
    if (!this.ctx) {
      this.ctx = new AudioContext();

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = VOLUME.sfx;
      this.sfxGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this._musicOn() ? VOLUME.music : 0;
      this.musicGain.connect(this.ctx.destination);

      // 1s de ruído branco reutilizado por vários efeitos
      this.noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate, this.ctx.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  private mtof(midi: number): number {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  // ---------- Blocos de síntese ----------

  private osc(dest: AudioNode, o: OscOptions): void {
    const ctx = this.ctx!;
    const { type = 'sine', freq, t, dur, vol = 0.2, slideTo = null, detune = 0 } = o;
    const node = ctx.createOscillator();
    const gain = ctx.createGain();
    node.type = type;
    node.frequency.setValueAtTime(freq, t);
    node.detune.value = detune;
    if (slideTo !== null) node.frequency.exponentialRampToValueAtTime(Math.max(slideTo, 1), t + dur);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    node.connect(gain).connect(dest);
    node.start(t);
    node.stop(t + dur + 0.05);
  }

  private noise(dest: AudioNode, n: NoiseOptions): void {
    const ctx = this.ctx!;
    const { t, dur, vol = 0.2, filter = 'bandpass', freq = 2000, freqEnd = null, q = 1 } = n;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = filter;
    f.frequency.setValueAtTime(freq, t);
    if (freqEnd !== null) f.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 20), t + dur);
    f.Q.value = q;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(gain).connect(dest);
    src.start(t);
    src.stop(t + dur + 0.05);
  }

  // ---------- Efeitos sonoros ----------

  private readonly sfx: Record<SfxName, (t: number) => void> = {
    deal: (t) =>
      this.noise(this.sfxGain, { t, dur: 0.09, vol: 0.25, freq: 1600, freqEnd: 3200, q: 0.8 }),

    click: (t) =>
      this.osc(this.sfxGain, { type: 'square', freq: 750, slideTo: 420, t, dur: 0.06, vol: 0.12 }),

    heal: (t) =>
      [72, 76, 79, 84].forEach((m, i) =>
        this.osc(this.sfxGain, { freq: this.mtof(m), t: t + i * 0.07, dur: 0.22, vol: 0.16 }),
      ),

    waste: (t) =>
      this.osc(this.sfxGain, { type: 'triangle', freq: 300, slideTo: 130, t, dur: 0.25, vol: 0.18 }),

    equip: (t) => {
      this.noise(this.sfxGain, { t, dur: 0.28, vol: 0.14, filter: 'highpass', freq: 3500, freqEnd: 7500, q: 2 });
      this.osc(this.sfxGain, { type: 'square', freq: 1250, t, dur: 0.14, vol: 0.07 });
      this.osc(this.sfxGain, { type: 'square', freq: 1870, t: t + 0.03, dur: 0.16, vol: 0.06 });
    },

    hitWeapon: (t) => {
      this.noise(this.sfxGain, { t, dur: 0.16, vol: 0.3, freq: 5000, freqEnd: 900, q: 1.2 });
      this.osc(this.sfxGain, { freq: 180, slideTo: 70, t: t + 0.04, dur: 0.2, vol: 0.35 });
    },

    hitHands: (t) => {
      this.osc(this.sfxGain, { freq: 150, slideTo: 55, t, dur: 0.25, vol: 0.45 });
      this.noise(this.sfxGain, { t, dur: 0.12, vol: 0.2, filter: 'lowpass', freq: 900 });
    },

    block: (t) => {
      this.osc(this.sfxGain, { freq: 2400, t, dur: 0.1, vol: 0.14 });
      this.osc(this.sfxGain, { freq: 3600, t: t + 0.02, dur: 0.12, vol: 0.08 });
    },

    run: (t) =>
      this.noise(this.sfxGain, { t, dur: 0.35, vol: 0.28, freq: 500, freqEnd: 2600, q: 1.5 }),

    win: (t) => {
      [60, 64, 67, 72, 76, 79, 84].forEach((m, i) =>
        this.osc(this.sfxGain, { type: 'triangle', freq: this.mtof(m), t: t + i * 0.1, dur: 0.3, vol: 0.2 }),
      );
      [84, 88, 91].forEach((m) =>
        this.osc(this.sfxGain, { type: 'triangle', freq: this.mtof(m), t: t + 0.75, dur: 0.9, vol: 0.12 }),
      );
    },

    lose: (t) =>
      [64, 63, 60, 55].forEach((m, i) => {
        this.osc(this.sfxGain, { type: 'triangle', freq: this.mtof(m), t: t + i * 0.28, dur: 0.5, vol: 0.16 });
        this.osc(this.sfxGain, { type: 'triangle', freq: this.mtof(m - 12), t: t + i * 0.28, dur: 0.5, vol: 0.1, detune: 8 });
      }),
  };

  // ---------- Trilha sonora (loop lo-fi procedural) ----------

  private startMusic(): void {
    if (this.musicTimer || !this.ctx) return;
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.1;
    const gain = this.musicGain.gain;
    gain.cancelScheduledValues(this.ctx.currentTime);
    gain.setValueAtTime(0.0001, this.ctx.currentTime);
    gain.exponentialRampToValueAtTime(VOLUME.music, this.ctx.currentTime + 1.5);
    this.musicTimer = setInterval(() => this.scheduler(), 100);
  }

  private stopMusic(): void {
    if (!this.musicTimer) return;
    clearInterval(this.musicTimer);
    this.musicTimer = null;
    if (this.ctx) {
      const gain = this.musicGain.gain;
      gain.cancelScheduledValues(this.ctx.currentTime);
      gain.setValueAtTime(gain.value, this.ctx.currentTime);
      gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.6);
    }
  }

  private scheduler(): void {
    const ctx = this.ctx!;
    while (this.nextTime < ctx.currentTime + 0.25) {
      const swung = this.nextTime + (this.step % 2 === 1 ? SWING : 0);
      this.scheduleStep(this.step, swung);
      this.nextTime += EIGHTH;
      this.step = (this.step + 1) % (8 * BARS.length * 2);
    }
  }

  /** Agenda um passo (colcheia) do compasso. */
  private scheduleStep(step: number, t: number): void {
    const bar = BARS[Math.floor(step / 8) % BARS.length];
    const inBar = step % 8;

    if (inBar % 2 === 0) this.hatTick(t, inBar === 4 ? 0.09 : 0.05);
    if (inBar === 0) this.bassNote(t, bar.bass, EIGHTH * 3);
    if (inBar === 6) this.bassNote(t, bar.bass + (step % 16 === 14 ? 12 : 0), EIGHTH * 1.2);
    if (inBar === 2 || inBar === 5) this.chordStab(t, bar.chord);
  }

  private bassNote(t: number, midi: number, dur: number): void {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    const f = ctx.createBiquadFilter();
    const g = ctx.createGain();
    o.type = 'triangle';
    o.frequency.value = this.mtof(midi);
    f.type = 'lowpass';
    f.frequency.value = 320;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.5, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f).connect(g).connect(this.musicGain);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  private chordStab(t: number, midis: readonly number[]): void {
    const ctx = this.ctx!;
    for (const m of midis) {
      const o = ctx.createOscillator();
      const f = ctx.createBiquadFilter();
      const g = ctx.createGain();
      o.type = 'triangle';
      o.frequency.value = this.mtof(m);
      o.detune.value = (Math.random() - 0.5) * 6; // leve imperfeição lo-fi
      f.type = 'lowpass';
      f.frequency.value = 1100;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.12, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
      o.connect(f).connect(g).connect(this.musicGain);
      o.start(t);
      o.stop(t + 1);
    }
  }

  private hatTick(t: number, vol: number): void {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = 7000;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
    src.connect(f).connect(g).connect(this.musicGain);
    src.start(t);
    src.stop(t + 0.08);
  }
}
