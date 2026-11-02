export type SoundName =
  | 'click'
  | 'card'
  | 'hit'
  | 'block'
  | 'draw'
  | 'heal'
  | 'buff'
  | 'debuff'
  | 'trap'
  | 'turn'
  | 'select'
  | 'victory'
  | 'defeat';

const STORAGE_KEY = 'card-coliseum:sound';

/**
 * 外部アセットなしで鳴らす効果音シンセサイザ。
 * すべての音をその場で合成するため、ロード待ちも追加ファイルも不要。
 */
class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private _enabled: boolean;

  constructor() {
    this._enabled = readEnabled();
  }

  get enabled(): boolean {
    return this._enabled;
  }

  toggle(): boolean {
    this._enabled = !this._enabled;
    writeEnabled(this._enabled);
    if (this._enabled) this.play('select');
    return this._enabled;
  }

  play(name: SoundName): void {
    if (!this._enabled) return;
    try {
      switch (name) {
        case 'click':
          this.tone(520, 0.05, 'square', 0.025);
          break;
        case 'card':
          this.tone(300, 0.12, 'triangle', 0.045, 520);
          break;
        case 'hit':
          this.noise(0.16, 0.075, 2000);
          this.tone(150, 0.18, 'sawtooth', 0.05, 55);
          break;
        case 'block':
          this.tone(240, 0.09, 'square', 0.035);
          this.tone(360, 0.08, 'square', 0.025, undefined, 0.04);
          break;
        case 'draw':
          this.tone(760, 0.06, 'sine', 0.03);
          break;
        case 'heal':
          this.tone(520, 0.16, 'sine', 0.04, 780);
          this.tone(780, 0.2, 'sine', 0.025, 1040, 0.06);
          break;
        case 'buff':
          this.tone(260, 0.22, 'sawtooth', 0.035, 620);
          break;
        case 'debuff':
          this.tone(300, 0.25, 'sawtooth', 0.035, 120);
          break;
        case 'trap':
          this.noise(0.22, 0.06, 1200);
          this.tone(180, 0.2, 'square', 0.035, 90, 0.05);
          break;
        case 'turn':
          this.tone(150, 0.2, 'sine', 0.04, 240);
          break;
        case 'select':
          this.tone(880, 0.08, 'sine', 0.03);
          break;
        case 'victory':
          [523.25, 659.25, 783.99, 1046.5].forEach((freq, index) => {
            this.tone(freq, 0.4, 'triangle', 0.045, undefined, index * 0.11);
          });
          break;
        case 'defeat':
          [300, 240, 180].forEach((freq, index) => {
            this.tone(freq, 0.5, 'sawtooth', 0.04, freq * 0.7, index * 0.16);
          });
          break;
        default:
          break;
      }
    } catch {
      // 音が鳴らなくてもゲームは進行する
    }
  }

  private ensure(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.55;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  private tone(
    frequency: number,
    duration: number,
    type: OscillatorType,
    gain: number,
    slideTo?: number,
    delay = 0,
  ): void {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const start = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const envelope = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, start);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), start + duration);
    }

    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(gain, start + 0.012);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    osc.connect(envelope);
    envelope.connect(this.master);
    osc.start(start);
    osc.stop(start + duration + 0.03);
  }

  private noise(duration: number, gain: number, cutoff: number): void {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;

    const frames = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i += 1) {
      const decay = 1 - i / frames;
      data[i] = (Math.random() * 2 - 1) * decay * decay;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = cutoff;

    const envelope = ctx.createGain();
    envelope.gain.value = gain;

    source.connect(filter);
    filter.connect(envelope);
    envelope.connect(this.master);
    source.start();
  }
}

function readEnabled(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== 'off';
  } catch {
    return true;
  }
}

function writeEnabled(value: boolean): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, value ? 'on' : 'off');
  } catch {
    // 保存できなくても動作に影響なし
  }
}

export const sfx = new Sfx();
