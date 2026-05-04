import { clamp, rand } from "./util.js";
import { guardado, persistir } from "./guardado.js";

export const audio = {
  ctx: null,
  master: null,
  musica: null,
  siguiente: 0,
  paso: 0,
  volumen: guardado.volumen,
  silencio: guardado.silencio,

  iniciar() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.musica = this.ctx.createGain();
      this.musica.gain.value = 0.18;
      this.master.gain.value = this.silencio ? 0 : this.volumen;
      this.musica.connect(this.master);
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state !== "running") this.ctx.resume();
  },

  fijarVolumen(v) {
    this.volumen = clamp(v, 0, 1);
    guardado.volumen = this.volumen;
    if (this.master) this.master.gain.value = this.silencio ? 0 : this.volumen;
    persistir();
  },

  alternarSilencio() {
    this.silencio = !this.silencio;
    guardado.silencio = this.silencio;
    if (this.master) this.master.gain.value = this.silencio ? 0 : this.volumen;
    persistir();
  },

  tono(freq, dur, tipo = "square", gan = 0.1, desliz = 0, destino = null) {
    if (!this.ctx || this.silencio) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = tipo;
    osc.frequency.setValueAtTime(freq, t);
    if (desliz) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq + desliz), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gan, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(destino || this.master);
    osc.start(t);
    osc.stop(t + dur + 0.04);
  },

  ruido(dur, gan = 0.1) {
    if (!this.ctx || this.silencio) return;
    const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * dur, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = rand(-1, 1) * (1 - i / data.length);
    const src = this.ctx.createBufferSource();
    const g = this.ctx.createGain();
    src.buffer = buffer;
    g.gain.value = gan;
    src.connect(g);
    g.connect(this.master);
    src.start();
  },

  sfx(nombre) {
    const fx = {
      disparo: () => this.tono(780, 0.055, "square", 0.055, 220),
      salto: () => this.tono(330, 0.12, "triangle", 0.08, 210),
      dash: () => { this.ruido(0.09, 0.08); this.tono(220, 0.08, "sawtooth", 0.05, 300); },
      golpe: () => { this.ruido(0.2, 0.15); this.tono(150, 0.18, "sawtooth", 0.09, -90); },
      muerte: () => { [240, 170, 110].forEach((f, i) => setTimeout(() => this.tono(f, 0.16, "triangle", 0.1), i * 100)); },
      moneda: () => { this.tono(880, 0.08, "triangle", 0.08, 220); setTimeout(() => this.tono(1320, 0.1, "triangle", 0.07), 80); },
      fase: () => { this.tono(110, 0.38, "sawtooth", 0.13, 440); this.ruido(0.28, 0.12); },
      victoria: () => [392, 494, 587, 784].forEach((f, i) => setTimeout(() => this.tono(f, 0.16, "square", 0.09), i * 100)),
      derrota: () => [330, 260, 190, 120].forEach((f, i) => setTimeout(() => this.tono(f, 0.18, "triangle", 0.12), i * 150)),
      parry: () => { this.tono(980, 0.09, "sine", 0.12, 460); this.tono(1470, 0.06, "triangle", 0.07); },
      super: () => { this.tono(90, 0.5, "sawtooth", 0.16, 520); this.ruido(0.5, 0.1); },
      comprar: () => [620, 780, 980].forEach((f, i) => setTimeout(() => this.tono(f, 0.08, "triangle", 0.07), i * 70))
    };
    fx[nombre]?.();
  },

  actualizar() {
    if (!this.ctx || this.silencio) return;
    const ahora = this.ctx.currentTime;
    if (this.siguiente < ahora) this.siguiente = ahora;
    while (this.siguiente < ahora + 0.08) {
      const beat = this.paso % 16;
      const swing = beat % 2 ? 0.055 : 0;
      const bajo = [98, 123, 131, 147, 110, 139, 147, 165][Math.floor(beat / 2) % 8];
      if (beat % 2 === 0) this.tono(bajo, 0.16, "triangle", 0.045, 0, this.musica);
      if ([0, 3, 6, 10, 13].includes(beat)) this.tono([392, 466, 523, 587][beat % 4], 0.12, "square", 0.025, -8, this.musica);
      if (beat % 4 === 2) this.ruido(0.025, 0.015);
      if (beat === 7 || beat === 15) this.tono(740, 0.05, "sawtooth", 0.025, 130, this.musica);
      this.siguiente += 0.145 + swing;
      this.paso++;
    }
  }
};

window.addEventListener("keydown", () => audio.iniciar(), { once: false });
window.addEventListener("pointerdown", () => audio.iniciar(), { once: false });
