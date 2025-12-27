
export class ASMRService {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playPlaceSound() {
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    // Very low, soft wooden thud
    osc.frequency.setValueAtTime(110, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(20, this.ctx.currentTime + 0.12);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(250, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  // Pure musical "Do-Re-Mi" progression using standard major scale frequencies
  playClearSound(combo: number = 0) {
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    
    // C Major Scale: Do Re Mi Fa Sol La Ti Do
    const majorScale = [
      261.63, // C4 (Do)
      293.66, // D4 (Re)
      329.63, // E4 (Mi)
      349.23, // F4 (Fa)
      392.00, // G4 (Sol)
      440.00, // A4 (La)
      493.88, // B4 (Ti)
      523.25  // C5 (Do)
    ];

    // Progression loops up the scale
    const noteIndex = combo % majorScale.length;
    const octaveMultiplier = Math.pow(2, Math.floor(combo / majorScale.length));
    const freq = majorScale[noteIndex] * octaveMultiplier;

    // Layered bell sound
    const harmonics = [1, 2, 4]; 
    harmonics.forEach((h, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const filter = this.ctx!.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * h, now);
      
      // Softer filter for a more healing vibe
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1500 / (i + 1), now);

      gain.gain.setValueAtTime(0.12 / (i + 1), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2 - (i * 0.2));

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now);
      osc.stop(now + 1.5);
    });
  }

  playPerfectClear() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // Harmonious chord for healing effect
    const chord = [261.63, 329.63, 392.00, 493.88, 523.25, 659.25];
    chord.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.1);
      
      gain.gain.setValueAtTime(0.08, now + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 2.0);
      
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 2.5);
    });
  }
}

export const asmr = new ASMRService();
