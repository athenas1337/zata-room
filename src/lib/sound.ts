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

  // Makima Jedag-Jedug Rhythmic Beat (Phonk / Cyber Bass pulse)
  playJedagJedugBeat() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    // Sub-bass kick (jedag)
    const kickOsc = ctx.createOscillator();
    const kickGain = ctx.createGain();
    kickOsc.type = 'sine';
    kickOsc.frequency.setValueAtTime(150, ctx.currentTime);
    kickOsc.frequency.exponentialRampToValueAtTime(32, ctx.currentTime + 0.15);

    kickGain.gain.setValueAtTime(0.25, ctx.currentTime);
    kickGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

    kickOsc.connect(kickGain);
    kickGain.connect(ctx.destination);

    kickOsc.start();
    kickOsc.stop(ctx.currentTime + 0.2);

    // Secondary beat (jedug)
    setTimeout(() => {
      if (!this.enabled || !this.ctx) return;
      const c = this.ctx;
      const subOsc = c.createOscillator();
      const subGain = c.createGain();
      subOsc.type = 'triangle';
      subOsc.frequency.setValueAtTime(110, c.currentTime);
      subOsc.frequency.exponentialRampToValueAtTime(45, c.currentTime + 0.25);

      subGain.gain.setValueAtTime(0.18, c.currentTime);
      subGain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.28);

      subOsc.connect(subGain);
      subGain.connect(c.destination);

      subOsc.start();
      subOsc.stop(c.currentTime + 0.28);
    }, 180);
  }

  // F42: Phonk / Cyber Lo-Fi Radio Player Generator
  startPhonkRadio(bpm = 130, onBeat?: (step: number) => void): boolean {
    if (!this.enabled) return false;
    this.stopPhonkRadio();
    this.isRadioPlaying = true;

    let step = 0;
    const stepIntervalMs = Math.round((60000 / bpm) / 2); // 8th note steps

    this.loopInterval = setInterval(() => {
      const ctx = this.getContext();
      if (!ctx || !this.isRadioPlaying) return;

      const time = ctx.currentTime;
      if (onBeat) onBeat(step % 16);

      // Kick on 0, 4, 8, 12 (4/4 groove)
      if (step % 4 === 0) {
        const kickOsc = ctx.createOscillator();
        const kickGain = ctx.createGain();
        kickOsc.type = 'sine';
        kickOsc.frequency.setValueAtTime(140, time);
        kickOsc.frequency.exponentialRampToValueAtTime(36, time + 0.12);

        kickGain.gain.setValueAtTime(0.18, time);
        kickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);

        kickOsc.connect(kickGain);
        kickGain.connect(ctx.destination);
        kickOsc.start(time);
        kickOsc.stop(time + 0.16);
      }

      // Snare / Clap on step 4 and 12
      if (step % 8 === 4) {
        const snareOsc = ctx.createOscillator();
        const snareGain = ctx.createGain();
        snareOsc.type = 'triangle';
        snareOsc.frequency.setValueAtTime(280, time);
        snareOsc.frequency.exponentialRampToValueAtTime(120, time + 0.08);

        snareGain.gain.setValueAtTime(0.08, time);
        snareGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

        snareOsc.connect(snareGain);
        snareGain.connect(ctx.destination);
        snareOsc.start(time);
        snareOsc.stop(time + 0.1);
      }

      // Hi-hat on odd steps (offbeats)
      if (step % 2 === 1) {
        const hatOsc = ctx.createOscillator();
        const hatGain = ctx.createGain();
        hatOsc.type = 'sawtooth';
        hatOsc.frequency.setValueAtTime(8000 + Math.random() * 2000, time);

        hatGain.gain.setValueAtTime(0.02, time);
        hatGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.04);

        hatOsc.connect(hatGain);
        hatGain.connect(ctx.destination);
        hatOsc.start(time);
        hatOsc.stop(time + 0.04);
      }

      // Lo-fi synth pad / dark chord on step 0 and 8
      if (step % 8 === 0) {
        const chords = [
          [220, 261.63, 329.63], // Am
          [174.61, 220, 261.63], // F
          [196, 246.94, 293.66], // G
          [164.81, 196, 246.94], // Em
        ];
        const chordIndex = Math.floor((step / 8) % chords.length);
        const currentChord = chords[chordIndex];

        currentChord.forEach((freq) => {
          const padOsc = ctx.createOscillator();
          const padGain = ctx.createGain();
          padOsc.type = 'sine';
          padOsc.frequency.setValueAtTime(freq, time);

          padGain.gain.setValueAtTime(0.025, time);
          padGain.gain.exponentialRampToValueAtTime(0.001, time + 0.7);

          padOsc.connect(padGain);
          padGain.connect(ctx.destination);
          padOsc.start(time);
          padOsc.stop(time + 0.7);
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
