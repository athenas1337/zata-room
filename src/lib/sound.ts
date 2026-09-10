// Zero-external-dependency sound generator powered by native Web Audio API
class SoundManager {
  private ctx: AudioContext | null = null;
  private enabled = true;
  private loopInterval: NodeJS.Timeout | null = null;
  private isRadioPlaying = false;
  private keySoundEnabled = true;

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('zata_sound_enabled');
      this.enabled = saved !== null ? saved === 'true' : true;
      const keySaved = localStorage.getItem('zata_key_sound_enabled');
      this.keySoundEnabled = keySaved !== null ? keySaved === 'true' : false;
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setEnabled(val: boolean) {
    this.enabled = val;
    if (typeof window !== 'undefined') {
      localStorage.setItem('zata_sound_enabled', String(val));
    }
    if (!val && this.isRadioPlaying) {
      this.stopPhonkRadio();
    }
  }

  toggle(): boolean {
    this.setEnabled(!this.enabled);
    return this.enabled;
  }

  isKeySoundEnabled(): boolean {
    return this.keySoundEnabled;
  }

  toggleKeySound(): boolean {
    this.keySoundEnabled = !this.keySoundEnabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('zata_key_sound_enabled', String(this.keySoundEnabled));
    }
    return this.keySoundEnabled;
  }

  // F47: Mechanical keyboard soundboard
  playKeyClick(switchType: 'blue' | 'brown' | 'cyber' = 'cyber') {
    if (!this.enabled || !this.keySoundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (switchType === 'blue') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1400 + Math.random() * 200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.03);
      gain.gain.setValueAtTime(0.03, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.035);
    } else if (switchType === 'brown') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(500 + Math.random() * 100, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.045);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(900 + Math.random() * 300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(350, ctx.currentTime + 0.025);
      gain.gain.setValueAtTime(0.025, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.03);
    }

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  }

  // Gentle futuristic chime when an agent begins speaking
  playTurnPing() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880, ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.15); // D6

    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.35);
    osc2.stop(ctx.currentTime + 0.35);
  }

  // Crisp mechanical click for button interactions
  playClick() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  }

  // Warm stop alert tone
  playStop() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  }

  // Human Checkpoint Ping
  playCheckpoint() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
    osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5

    gain.gain.setValueAtTime(0.07, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.45);
  }

  // F45: Holographic glitch on safety alert
  playGlitchSound() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, ctx.currentTime);
    osc.frequency.setValueAtTime(820, ctx.currentTime + 0.05);
    osc.frequency.setValueAtTime(240, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.18);
  }

  // Authentic 808 Memphis / TikTok Phonk Cowbell Synthesizer
  playPhonkCowbell(freq = 880, time?: number, duration = 0.14) {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const t = time ?? ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const bandpass = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    // Cowbell frequency ratio
    osc1.type = 'square';
    osc1.frequency.setValueAtTime(freq, t);

    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(freq * 1.48, t); // Metallic interval

    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(freq * 1.2, t);
    bandpass.Q.setValueAtTime(2.5, t);

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    osc1.connect(bandpass);
    osc2.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + duration);
    osc2.stop(t + duration);
  }

  // Makima Jedag-Jedug Rhythmic Beat (TikTok Phonk Bass pulse)
  playJedagJedugBeat() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // 1. Heavy 808 Sub-Bass Kick (Jedag)
    const kickOsc = ctx.createOscillator();
    const kickGain = ctx.createGain();
    kickOsc.type = 'sine';
    kickOsc.frequency.setValueAtTime(160, now);
    kickOsc.frequency.exponentialRampToValueAtTime(32, now + 0.18);

    kickGain.gain.setValueAtTime(0.35, now);
    kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    kickOsc.connect(kickGain);
    kickGain.connect(ctx.destination);
    kickOsc.start(now);
    kickOsc.stop(now + 0.22);

    // 2. Play iconic Phonk Cowbell drop
    this.playPhonkCowbell(880, now, 0.15); // A5
    this.playPhonkCowbell(1046.5, now + 0.12, 0.18); // C6

    // 3. Secondary beat (Jedug)
    setTimeout(() => {
      if (!this.enabled || !this.ctx) return;
      const c = this.ctx;
      const t2 = c.currentTime;
      const subOsc = c.createOscillator();
      const subGain = c.createGain();
      subOsc.type = 'triangle';
      subOsc.frequency.setValueAtTime(120, t2);
      subOsc.frequency.exponentialRampToValueAtTime(42, t2 + 0.28);

      subGain.gain.setValueAtTime(0.22, t2);
      subGain.gain.exponentialRampToValueAtTime(0.001, t2 + 0.3);

      subOsc.connect(subGain);
      subGain.connect(c.destination);
      subOsc.start(t2);
      subOsc.stop(t2 + 0.3);

      this.playPhonkCowbell(783.99, t2, 0.15); // G5
    }, 180);
  }

  // F42: Upgraded TikTok & YouTube Viral Drift Phonk Radio Player
  startPhonkRadio(
    bpm = 138,
    style: 'tiktok_drift' | 'tokyo_night' | 'makima_velvet' = 'tiktok_drift',
    onBeat?: (step: number) => void
  ): boolean {
    if (!this.enabled) return false;
    this.stopPhonkRadio();
    this.isRadioPlaying = true;

    let step = 0;
    const stepIntervalMs = Math.round((60000 / bpm) / 4); // 16th-note precision

    // Classic Memphis / TikTok viral cowbell scale (frequencies in Hz)
    // Scale: A4 (440), C5 (523), D5 (587), E5 (659), G5 (784), A5 (880), C6 (1046)
    const cowbellPattern = [
      880,  0, 880, 0,  1046, 0, 784, 0,
      880,  0, 659, 0,  784,  0, 587, 0,
      880,  0, 880, 0,  1046, 0, 1174, 0,
      1046, 0, 880, 0,  784,  0, 659, 0,
    ];

    this.loopInterval = setInterval(() => {
      const ctx = this.getContext();
      if (!ctx || !this.isRadioPlaying) return;

      const time = ctx.currentTime;
      const modStep16 = step % 16;
      const modStep32 = step % 32;

      if (onBeat) onBeat(modStep16);

      // 1. Kick on 0, 6, 8, 14 (Syncopated Memphis trap groove)
      if (modStep16 === 0 || modStep16 === 6 || modStep16 === 8 || modStep16 === 14) {
        const kickOsc = ctx.createOscillator();
        const kickGain = ctx.createGain();
        kickOsc.type = 'sine';
        kickOsc.frequency.setValueAtTime(155, time);
        kickOsc.frequency.exponentialRampToValueAtTime(36, time + 0.15);

        kickGain.gain.setValueAtTime(0.26, time);
        kickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

        kickOsc.connect(kickGain);
        kickGain.connect(ctx.destination);
        kickOsc.start(time);
        kickOsc.stop(time + 0.18);
      }

      // 2. Heavy 808 Sub-Bass Slide
      if (modStep16 === 0 || modStep16 === 8) {
        const bassOsc = ctx.createOscillator();
        const bassGain = ctx.createGain();
        bassOsc.type = 'triangle';
        const bassFreq = modStep16 === 0 ? 55 : 49; // A1 / G1
        bassOsc.frequency.setValueAtTime(bassFreq, time);
        bassOsc.frequency.linearRampToValueAtTime(bassFreq * 1.05, time + 0.2);

        bassGain.gain.setValueAtTime(0.18, time);
        bassGain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

        bassOsc.connect(bassGain);
        bassGain.connect(ctx.destination);
        bassOsc.start(time);
        bassOsc.stop(time + 0.35);
      }

      // 3. Phonk Snare / Clap on 4 and 12
      if (modStep16 === 4 || modStep16 === 12) {
        const snareOsc = ctx.createOscillator();
        const snareGain = ctx.createGain();
        snareOsc.type = 'triangle';
        snareOsc.frequency.setValueAtTime(260, time);
        snareOsc.frequency.exponentialRampToValueAtTime(110, time + 0.08);

        snareGain.gain.setValueAtTime(0.12, time);
        snareGain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

        snareOsc.connect(snareGain);
        snareGain.connect(ctx.destination);
        snareOsc.start(time);
        snareOsc.stop(time + 0.12);
      }

      // 4. Trap Hi-hat (Fast 16th-notes with rolls on 14 & 15)
      if (step % 2 === 0 || modStep16 >= 14) {
        const hatOsc = ctx.createOscillator();
        const hatGain = ctx.createGain();
        hatOsc.type = 'sawtooth';
        hatOsc.frequency.setValueAtTime(9000 + Math.random() * 1500, time);

        hatGain.gain.setValueAtTime(modStep16 >= 14 ? 0.025 : 0.015, time);
        hatGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.03);

        hatOsc.connect(hatGain);
        hatGain.connect(ctx.destination);
        hatOsc.start(time);
        hatOsc.stop(time + 0.03);
      }

      // 5. Signature TikTok Viral Drift Phonk Cowbell Melody!
      if (style !== 'makima_velvet') {
        const note = cowbellPattern[modStep32];
        if (note > 0) {
          this.playPhonkCowbell(note, time, 0.12);
        }
      } else if (modStep16 === 0 || modStep16 === 8) {
        // Ambient chill pad chord for velvet mode
        const padFreqs = [220, 261.63, 329.63]; // Am
        padFreqs.forEach((f) => {
          const padOsc = ctx.createOscillator();
          const padGain = ctx.createGain();
          padOsc.type = 'sine';
          padOsc.frequency.setValueAtTime(f, time);
          padGain.gain.setValueAtTime(0.02, time);
          padGain.gain.exponentialRampToValueAtTime(0.001, time + 0.6);
          padOsc.connect(padGain);
          padGain.connect(ctx.destination);
          padOsc.start(time);
          padOsc.stop(time + 0.6);
        });
      }

      step++;
    }, stepIntervalMs);

    return true;
  }

  stopPhonkRadio() {
    this.isRadioPlaying = false;
    if (this.loopInterval) {
      clearInterval(this.loopInterval);
      this.loopInterval = null;
    }
  }

  isRadioActive(): boolean {
    return this.isRadioPlaying;
  }
}

export const soundManager = new SoundManager();
