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
  mundo: 1,
  tempo: 0.145,
  octava: 1,

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

  cambiarMundo(id) {
    this.mundo = id;
    const tempos = [0, 0.13, 0.19, 0.105, 0.23, 0.088];
    const octavas = [0, 0.8, 1.45, 1.1, 0.62, 0.95];
    this.tempo = tempos[id] || 0.145;
    this.octava = octavas[id] || 1;
    if (this.ctx) {
      this.siguiente = this.ctx.currentTime + 0.05;
      this.paso = 0;
    }
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

      const escalasBajos = {
        1: [98, 123, 131, 147, 110, 139, 147, 165],
        2: [196, 220, 246, 261, 196, 220, 246, 294],
        3: [130, 146, 155, 174, 130, 155, 174, 196],
        4: [65, 73, 82, 87, 65, 73, 87, 98],
        5: [110, 110, 123, 123, 98, 98, 131, 131]
      };
      const bajos = escalasBajos[this.mundo] || escalasBajos[1];
      const bajo = bajos[Math.floor(beat / 2) % 8];

      const tiposBajo = { 1: "triangle", 2: "sine", 3: "triangle", 4: "sine", 5: "sawtooth" };
      const tipoMelodia = { 1: "square", 2: "triangle", 3: "triangle", 4: "sine", 5: "sawtooth" };
      const tipoBajo = tiposBajo[this.mundo] || "triangle";
      const tipo = tipoMelodia[this.mundo] || "square";

      if (beat % (this.mundo === 5 ? 1 : 2) === 0) {
        this.tono(bajo, 0.16, tipoBajo, 0.045, 0, this.musica);
      }

      const escalasArmonias = {
        1: [392, 466, 523, 587],
        2: [523, 587, 659, 784],
        3: [349, 392, 440, 523],
        4: [261, 294, 329, 392],
        5: [220, 220, 247, 262]
      };
      const armonias = escalasArmonias[this.mundo] || escalasArmonias[1];

      const durNota = { 1: 0.12, 2: 0.32, 3: 0.09, 4: 0.38, 5: 0.07 };
      const dur = durNota[this.mundo] || 0.12;

      const patronesMelodia = {
        1: [0, 3, 6, 10, 13],
        2: [0, 4, 8, 12],
        3: [0, 2, 4, 6, 8, 10, 12, 14],
        4: [0, 8],
        5: [0, 1, 4, 5, 8, 9, 12, 13]
      };
      const patron = patronesMelodia[this.mundo] || patronesMelodia[1];

      if (patron.includes(beat)) {
        this.tono(armonias[beat % armonias.length], dur, tipo, 0.028, -8, this.musica);
      }

      const patronRuido = {
        1: beat % 4 === 2,
        2: beat % 8 === 0,
        3: beat % 2 === 1,
        4: beat === 0 || beat === 8,
        5: beat % 2 === 0
      };
      if (patronRuido[this.mundo]) {
        const volRuido = { 1: 0.015, 2: 0.008, 3: 0.022, 4: 0.01, 5: 0.03 };
        this.ruido(this.mundo === 5 ? 0.06 : 0.025, volRuido[this.mundo] || 0.015);
      }

      if (beat === 7 || beat === 15) {
        const accentFreqs = { 1: 740, 2: 1047, 3: 622, 4: 370, 5: 440 };
        const accentTipos = { 1: "sawtooth", 2: "triangle", 3: "triangle", 4: "sine", 5: "sawtooth" };
        this.tono(accentFreqs[this.mundo] || 740, 0.055, accentTipos[this.mundo] || "sawtooth", 0.028, 130, this.musica);
      }

      this.siguiente += this.tempo + swing;
      this.paso++;
    }
  }
};

window.addEventListener("keydown", () => audio.iniciar(), { once: false });
window.addEventListener("pointerdown", () => audio.iniciar(), { once: false });
