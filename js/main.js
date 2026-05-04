import { audio } from "./audio.js";
import { input } from "./input.js";
import { guardado, persistir, registrarGrado } from "./guardado.js";
import { Camara } from "./camara.js";
import { SistemaParticulas } from "./particulas.js";
import { SistemaBalas } from "./bala.js";
import { Jugador } from "./jugador.js";
import { Enemigo } from "./enemigo.js";
import { crearNivel, MUNDOS } from "./nivel.js";
import { construirSprites } from "../sprites/sprites.js";
import { ANCHO, ALTO, TAU, aabb, clamp, rand, texto, tinta } from "./util.js";
import { dibujarHud, dibujarPausa } from "./ui/hud.js";
import { dibujarTitulo, dibujarSeleccion } from "./ui/pantallaTitulo.js";
import { dibujarMapa, dibujarTienda } from "./ui/mapaMundo.js";
import { dibujarResultados, dibujarDerrota } from "./ui/resultados.js";
import { dibujarConfiguracion } from "./ui/configuracion.js";

const canvas = document.getElementById("juego");
const ctx = canvas.getContext("2d");

construirSprites();

const juego = {
  estado: "titulo",
  t: 0,
  dt: 0,
  ultimo: 0,
  guardado,
  audio,
  input,
  camara: new Camara(),
  particulas: new SistemaParticulas(),
  balas: new SistemaBalas(),
  jugador: new Jugador(guardado.personaje),
  nivel: null,
  mundo: 1,
  vidas: 3,
  puntos: 0,
  monedas: guardado.monedas,
  combo: 1,
  comboTiempo: 0,
  tiempo: 0,
  menu: 0,
  selector: ["tacita", "platon", "tetito"].indexOf(guardado.personaje),
  resultado: null,
  cortina: 0,
  oscuridad: 0,
  invertido: 0,
  victoriaFinal: false,
  extraVida: false,

  iniciar() {
    this.jugador.configurar(guardado.personaje, guardado);
    requestAnimationFrame(this.bucle.bind(this));
  },

  bucle(ts) {
    this.dt = Math.min(0.033, (ts - this.ultimo) / 1000 || 0.016);
    this.ultimo = ts;
    this.t += this.dt;
    audio.actualizar();
    this.actualizar(this.dt);
    this.dibujar(ctx);
    input.finFrame();
    requestAnimationFrame(this.bucle.bind(this));
  },

  cambiar(estado) {
    this.estado = estado;
    this.menu = 0;
    this.cortina = 0.55;
  },

  iniciarNivel(id) {
    this.mundo = id;
    this.nivel = crearNivel(id);
    this.jugador.configurar(guardado.personaje, guardado);
    this.jugador.aereo = ["aereo", "submarino"].includes(this.nivel.modo);
    this.jugador.x = this.nivel.modo === "jefe" ? 145 : 110;
    this.jugador.y = this.jugador.aereo ? 360 : 520;
    this.tiempo = 0;
    this.combo = 1;
    this.comboTiempo = 0;
    this.oscuridad = 0;
    this.invertido = 0;
    this.balas.limpiar();
    this.particulas.limpiar();
    this.cambiar("jugar");
  },

  reiniciarNivel() {
    this.iniciarNivel(this.mundo);
  },

  crearEnemigo(tipo, x, y) {
    return new Enemigo(tipo, x, y, [x - 180, x + 180]);
  },

  sumarPuntos(n) {
    this.comboTiempo = 2.2;
    this.combo = clamp(this.combo + 0.15, 1, 6);
    this.puntos += Math.floor(n * this.combo);
    if (this.puntos >= 10000 && !this.extraVida) {
      this.vidas++;
      this.extraVida = true;
    }
  },

  completarNivel() {
    this.victoriaFinal = this.mundo === 5;
    guardado.desbloqueado = Math.max(guardado.desbloqueado, this.mundo + 1);
    guardado.monedas = this.monedas;
    guardado.record = Math.max(guardado.record, this.puntos);
    this.resultado = this.calcularGrado();
    registrarGrado(this.mundo, this.resultado.grado);
    persistir();
    this.cambiar("resultados");
  },

  calcularGrado() {
    const p = this.jugador;
    const precision = p.disparos ? p.aciertos / p.disparos : 1;
    let nota = 100;
    nota -= p.golpes * 12;
    nota -= Math.max(0, this.tiempo - 105) * 0.18;
    nota += p.parries * 4;
    nota += precision * 18;
    nota += this.combo > 3 ? 5 : 0;
    const grado = nota > 112 ? "S" : nota > 95 ? "A" : nota > 78 ? "B" : nota > 60 ? "C" : "D";
    return { grado, precision, golpes: p.golpes, parries: p.parries, tiempo: this.tiempo };
  },

  derrota() {
    audio.sfx("derrota");
    guardado.record = Math.max(guardado.record, this.puntos);
    persistir();
    this.cambiar("derrota");
  },

  comprar() {
    const items = [
      ["vida", 8], ["cadencia", 7], ["velocidad", 6], ["super", 9]
    ];
    const [id, coste] = items[this.menu];
    if (guardado.monedas >= coste && guardado.mejoras[id] < 5) {
      guardado.monedas -= coste;
      guardado.mejoras[id]++;
      this.monedas = guardado.monedas;
      audio.sfx("comprar");
      persistir();
    }
  },

  actualizar(dt) {
    this.cortina = Math.max(0, this.cortina - dt);
    this.oscuridad = Math.max(0, this.oscuridad - dt * 0.22);
    this.invertido = Math.max(0, this.invertido - dt);
    guardado.mejoraSuper = (guardado.mejoras.super || 0) * 0.35;
    if (this.estado === "titulo") {
      if (input.confirmar()) this.cambiar("mapa");
      if (input.consumir("KeyP")) this.cambiar("personaje");
      if (input.consumir("KeyS")) this.cambiar("configuracion");
    } else if (this.estado === "personaje") {
      if (input.izq()) this.selector = Math.max(0, this.selector - 1);
      if (input.der()) this.selector = Math.min(2, this.selector + 1);
      if (input.confirmar()) {
        guardado.personaje = ["tacita", "platon", "tetito"][this.selector];
        persistir();
        this.cambiar("titulo");
      }
    } else if (this.estado === "mapa") {
      if (input.izq()) this.menu = Math.max(0, this.menu - 1);
      if (input.der()) this.menu = Math.min(4, this.menu + 1);
      if (input.confirmar() && this.menu + 1 <= guardado.desbloqueado) this.iniciarNivel(this.menu + 1);
      if (input.consumir("KeyT")) this.cambiar("tienda");
      if (input.consumir("KeyS")) this.cambiar("configuracion");
    } else if (this.estado === "tienda") {
      if (input.arriba()) this.menu = Math.max(0, this.menu - 1);
      if (input.abajo()) this.menu = Math.min(3, this.menu + 1);
      if (input.confirmar()) this.comprar();
      if (input.atras()) this.cambiar("mapa");
    } else if (this.estado === "configuracion") {
      if (input.izq()) audio.fijarVolumen(audio.volumen - 0.05);
      if (input.der()) audio.fijarVolumen(audio.volumen + 0.05);
      if (input.consumir("KeyM")) audio.alternarSilencio();
      if (input.confirmar() || input.atras()) this.cambiar("titulo");
    } else if (this.estado === "jugar") {
      if (input.pausa()) { this.cambiar("pausa"); return; }
      this.actualizarJuego(dt);
    } else if (this.estado === "pausa") {
      if (input.pausa() || input.confirmar()) this.cambiar("jugar");
      if (input.consumir("KeyQ")) this.cambiar("mapa");
    } else if (this.estado === "derrota") {
      if (input.confirmar()) { this.vidas = 3; this.puntos = 0; this.extraVida = false; this.cambiar("mapa"); }
    } else if (this.estado === "resultados") {
      if (input.confirmar()) this.cambiar("mapa");
    }
  },

  actualizarJuego(dt) {
    this.tiempo += dt;
    this.comboTiempo -= dt;
    if (this.comboTiempo <= 0) this.combo += (1 - this.combo) * 0.04;
    this.jugador.actualizar(dt, this);
    if (["aereo", "submarino"].includes(this.nivel.modo)) this.jugador.x += (this.nivel.submarino ? 65 : 92) * dt;
    this.camara.seguir(this.jugador, this.nivel.ancho);
    this.camara.actualizar(dt);
    for (const e of this.nivel.enemigos) e.actualizar?.(dt, this);
    this.nivel.jefe?.actualizar(dt, this);
    this.balas.actualizar(dt, this);
    this.particulas.actualizar(dt);
    this.recogerMonedas();
    if (this.nivel.modo !== "jefe" && this.nivel.jefe?.activo && this.jugador.x > this.nivel.ancho - 760) this.nivel.jefe.x = this.nivel.ancho - 260;
    if (this.nivel.modo !== "jefe" && this.jugador.x > this.nivel.ancho - 130 && !this.nivel.jefe?.activo) this.completarNivel();
    if (this.tiempo > this.nivel.tiempoLimite) this.jugador.herir(this);
  },

  recogerMonedas() {
    const r = this.jugador.rect();
    for (const c of this.nivel.monedas) {
      if (!c.tomada && aabb(r, c)) {
        c.tomada = true;
        this.monedas++;
        this.sumarPuntos(100);
        this.particulas.estallido(c.x, c.y, "#f4d35e", 10, 160);
        audio.sfx("moneda");
      }
    }
  },

  dibujar(g) {
    g.clearRect(0, 0, ANCHO, ALTO);
    if (this.estado === "jugar" || this.estado === "pausa") {
      g.save();
      if (this.invertido > 0) {
        g.translate(ANCHO, ALTO);
        g.rotate(Math.PI);
      }
      this.camara.aplicar(g);
      dibujarNivel(g, this);
      for (const c of this.nivel.monedas) dibujarMoneda(g, c, this.t);
      for (const e of this.nivel.enemigos) e.dibujar?.(g, this.t);
      this.nivel.jefe?.dibujar(g, this.t);
      this.balas.dibujar(g);
      this.particulas.dibujar(g);
      this.jugador.dibujar(g, this.t);
      g.restore();
      dibujarHud(g, this);
      if (this.camara.lensFlare > 0) dibujarLensFlare(g, this.camara.lensFlare);
      if (this.oscuridad > 0) { g.fillStyle = `rgba(0,0,0,${this.oscuridad})`; g.fillRect(0, 0, ANCHO, ALTO); }
      if (this.estado === "pausa") dibujarPausa(g);
    } else if (this.estado === "titulo") dibujarTitulo(g, this);
    else if (this.estado === "personaje") dibujarSeleccion(g, this);
    else if (this.estado === "mapa") dibujarMapa(g, this);
    else if (this.estado === "tienda") dibujarTienda(g, this);
    else if (this.estado === "configuracion") dibujarConfiguracion(g, this);
    else if (this.estado === "derrota") dibujarDerrota(g, this);
    else if (this.estado === "resultados") dibujarResultados(g, this);
    dibujarPelicula(g, this.t);
    dibujarCortina(g, this.cortina);
  }
};

function dibujarNivel(g, juego) {
  const n = juego.nivel;
  const x0 = juego.camara.x;
  const grad = g.createLinearGradient(0, 0, 0, ALTO);
  const paletas = {
    1: ["#8aa05d", "#d9bd77"],
    2: ["#7a4c92", "#e0924e"],
    3: ["#593a4c", "#c99b51"],
    4: ["#1d3e62", "#4f9bab"],
    5: ["#35251f", "#9b2f24"]
  };
  grad.addColorStop(0, paletas[n.id][0]);
  grad.addColorStop(1, paletas[n.id][1]);
  g.fillStyle = grad;
  g.fillRect(x0 - 80, 0, ANCHO + 160, ALTO);
  dibujarParallax(g, n, x0, juego.t);
  for (const p of n.plataformas) {
    tinta(g, n.id === 3 ? "#6d312e" : n.id === 5 ? "#5d5044" : "#7d593c", "#1a100c", 5);
    g.beginPath();
    g.roundRect(p.x, p.y, p.w, p.h, 8);
    g.fill();
    g.stroke();
    if (n.id === 1) {
      g.fillStyle = "#42683c";
      for (let x = p.x + 30; x < p.x + p.w; x += 70) { g.beginPath(); g.arc(x, p.y - 8, 22, 0, TAU); g.fill(); }
    }
    if (n.id === 3) {
      g.fillStyle = "#f1dfb8";
      for (let x = p.x + 25; x < p.x + p.w; x += 60) { g.beginPath(); g.arc(x, p.y + 13, 8, 0, TAU); g.fill(); }
    }
  }
}

function dibujarParallax(g, n, x0, t) {
  for (let capa = 1; capa <= 3; capa++) {
    g.save();
    g.globalAlpha = 0.18 + capa * 0.06;
    for (let i = -1; i < 9; i++) {
      const x = x0 + i * 210 - (x0 * 0.15 * capa) % 210;
      const y = 135 + capa * 80 + Math.sin(t + i) * 12;
      g.fillStyle = n.id === 4 ? "#b7e0df" : n.id === 2 ? "#ffe0b2" : "#2e1d16";
      g.beginPath();
      g.ellipse(x, y, 70 - capa * 8, 24, 0, 0, TAU);
      g.fill();
      if (n.id === 4) {
        g.beginPath();
        g.arc(x + 45, y + 80 + Math.sin(t * 2 + i) * 30, 7, 0, TAU);
        g.fill();
      }
    }
    g.restore();
  }
}

function dibujarMoneda(g, c, t) {
  if (c.tomada) return;
  g.save();
  g.translate(c.x, c.y);
  g.scale(Math.cos(t * 5 + c.x) * 0.45 + 0.6, 1);
  tinta(g, "#f1c75b", "#1a100c", 3);
  g.beginPath();
  g.arc(0, 0, 12, 0, TAU);
  g.fill();
  g.stroke();
  g.strokeStyle = "#7b531d";
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(0, -6);
  g.lineTo(0, 6);
  g.stroke();
  g.restore();
}

function dibujarLensFlare(g, v) {
  g.save();
  g.globalAlpha = v;
  const grad = g.createRadialGradient(480, 320, 20, 480, 320, 420);
  grad.addColorStop(0, "rgba(255,245,170,0.75)");
  grad.addColorStop(1, "rgba(255,245,170,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, ANCHO, ALTO);
  g.restore();
}

function dibujarPelicula(g, t) {
  g.save();
  g.globalCompositeOperation = "multiply";
  g.fillStyle = `rgba(92,57,33,${0.14 + Math.sin(t * 37) * 0.018})`;
  g.fillRect(0, 0, ANCHO, ALTO);
  g.globalCompositeOperation = "source-over";
  g.fillStyle = "rgba(0,0,0,0.13)";
  for (let y = 0; y < ALTO; y += 4) g.fillRect(0, y, ANCHO, 1);
  for (let i = 0; i < 700; i++) {
    const x = ((Math.sin(i * 91.7 + Math.floor(t * 18) * 11.3) * 10000) % ANCHO + ANCHO) % ANCHO;
    const y = ((Math.sin(i * 43.2 + t * 3) * 10000) % ALTO + ALTO) % ALTO;
    g.globalAlpha = 0.025;
    g.fillStyle = i % 2 ? "#fff7d6" : "#000";
    g.fillRect(x, y, 1.5, 1.5);
  }
  const vg = g.createRadialGradient(ANCHO / 2, ALTO / 2, 170, ANCHO / 2, ALTO / 2, 610);
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(1, "rgba(0,0,0,0.58)");
  g.globalAlpha = 1;
  g.fillStyle = vg;
  g.fillRect(0, 0, ANCHO, ALTO);
  g.restore();
}

function dibujarCortina(g, v) {
  if (v <= 0) return;
  g.save();
  const ancho = ANCHO * v;
  g.fillStyle = "#120b09";
  g.fillRect(0, 0, ancho, ALTO);
  g.fillRect(ANCHO - ancho, 0, ancho, ALTO);
  g.fillStyle = "#f1dfb8";
  for (let y = 20; y < ALTO; y += 52) {
    g.fillRect(ancho - 18, y, 12, 24);
    g.fillRect(ANCHO - ancho + 6, y, 12, 24);
  }
  g.restore();
}

window.juegoPorcelana = juego;
juego.iniciar();
