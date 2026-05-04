import { audio } from "./audio.js";
import { input } from "./input.js";
import { guardado, persistir, registrarGrado, subnivelDesbloqueado } from "./guardado.js";
import { Camara } from "./camara.js";
import { SistemaParticulas } from "./particulas.js";
import { SistemaBalas } from "./bala.js";
import { Jugador } from "./jugador.js";
import { Enemigo } from "./enemigo.js";
import { crearSubNivel, MUNDOS } from "./nivel.js";
import { agregarPuntaje, limpiarLeaderboard, obtenerLeaderboard } from "./leaderboard.js";
import { construirSprites } from "../sprites/sprites.js";
import { ANCHO, ALTO, TAU, aabb, clamp, rand, texto, tinta } from "./util.js";
import { dibujarHud, dibujarPausa } from "./ui/hud.js";
import { dibujarTitulo, dibujarSeleccion } from "./ui/pantallaTitulo.js";
import { dibujarMapa, dibujarSubmundo, dibujarTienda, ITEMS_TIENDA } from "./ui/mapaMundo.js";
import { dibujarResultados, dibujarDerrota } from "./ui/resultados.js";
import { dibujarConfiguracion } from "./ui/configuracion.js";
import { dibujarIngresoNombre, dibujarLeaderboard } from "./ui/leaderboard.js";
import { iniciarControlesMovil } from "./controles_movil.js";
import { crearIntro, crearIntroJefe, crearVictoriaFinal } from "./cinematicas/intro.js";
import { cargarLogros, desbloquearLogro, DEFINICIONES_LOGROS, guardarLogros } from "./logros.js";

const canvas = document.getElementById("juego");
const ctx = canvas.getContext("2d");

iniciarControlesMovil();

const juego = {
  estado: "carga",
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
  subNivel: 1,
  mundoSeleccionado: 1,
  subMenu: 0,
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
  logros: cargarLogros(),
  notificaciones: [],
  pausaMenu: 0,
  nombreEntrada: guardado.nombreJugador || "",
  letraActual: "A",
  posicionPendiente: null,
  entradaLeaderboard: null,
  confirmarResetTabla: false,
  cinematica: null,
  siguienteEstadoCinematica: "titulo",
  cargaProgreso: 0,
  spritesListos: false,

  iniciar() {
    requestAnimationFrame(this.bucle.bind(this));
    this.cargarSprites();
  },

  async cargarSprites() {
    for (let i = 0; i <= 6; i++) {
      this.cargaProgreso = i / 7;
      await new Promise(resolve => setTimeout(resolve, 45));
    }
    construirSprites();
    this.cargaProgreso = 1;
    this.spritesListos = true;
    this.jugador.configurar(guardado.personaje, guardado);
    if (!guardado.introVista) {
      this.cinematica = crearIntro();
      this.siguienteEstadoCinematica = "titulo";
      this.cambiar("cinematica_intro");
    } else {
      this.cambiar("titulo");
    }
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

  iniciarNivel(id, subId = 1) {
    this.mundo = id;
    this.subNivel = subId;
    this.nivel = crearSubNivel(id, subId);
    audio.cambiarMundo(id);
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
    if (subId === 3 && this.nivel.jefe) {
      this.cinematica = crearIntroJefe(this.nivel.jefe);
      this.siguienteEstadoCinematica = "jugar";
      this.cambiar("cinematica_jefe");
    } else {
      this.cambiar("jugar");
    }
  },

  reiniciarNivel() {
    this.iniciarNivel(this.mundo, this.subNivel);
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
    if (this.combo >= 5) this.logro("comboMaestro");
  },

  logro(id) {
    const logro = desbloquearLogro(this.logros, id);
    if (!logro) return;
    this.notificaciones.push({ texto: `LOGRO: ${logro.nombre}`, vida: 3 });
    audio.sfx("victoria");
  },

  guardarLogros() {
    guardarLogros(this.logros);
  },

  completarNivel() {
    this.victoriaFinal = this.mundo === 5;
    if (this.subNivel === 3) guardado.desbloqueado = Math.max(guardado.desbloqueado, this.mundo + 1);
    guardado.monedas = this.monedas;
    guardado.record = Math.max(guardado.record, this.puntos);
    this.resultado = this.calcularGrado();
    if (this.jugador.golpes === 0) this.logro("sinRasguino");
    if (this.nivel.monedas.every(c => c.tomada)) this.logro("coleccionista");
    if (this.jugador.parries >= 5) this.logro("parryMaestro");
    if (this.subNivel === 1 && this.tiempo < 30) this.logro("velocista");
    registrarGrado(this.mundo, this.resultado.grado, this.subNivel);
    persistir();
    const tabla = obtenerLeaderboard();
    const entra = tabla.length < 10 || this.puntos > (tabla[tabla.length - 1]?.puntos || 0);
    if (this.victoriaFinal) {
      this.cinematica = crearVictoriaFinal(this);
      this.siguienteEstadoCinematica = entra ? "ingresar_nombre" : "resultados";
      this.cambiar("cinematica_victoria");
    } else if (entra) {
      const provisional = [...tabla, { puntos: this.puntos }].sort((a, b) => b.puntos - a.puntos);
      this.posicionPendiente = provisional.findIndex(e => e.puntos === this.puntos) + 1;
      this.nombreEntrada = guardado.nombreJugador || "";
      this.letraActual = "A";
      this.cambiar("ingresar_nombre");
    } else {
      this.cambiar("resultados");
    }
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
    const item = ITEMS_TIENDA[this.menu];
    const nivel = guardado.mejoras[item.id] || 0;
    if (guardado.monedas >= item.costo && nivel < item.max) {
      guardado.monedas -= item.costo;
      guardado.mejoras[item.id] = nivel + 1;
      this.monedas = guardado.monedas;
      for (let i = 0; i < 24; i++) this.particulas.estallido(480 + rand(-40, 40), 150, "#f4d35e", 1, 260);
      audio.sfx("comprar");
      persistir();
    }
  },

  actualizar(dt) {
    this.cortina = Math.max(0, this.cortina - dt);
    this.oscuridad = Math.max(0, this.oscuridad - dt * 0.22);
    this.invertido = Math.max(0, this.invertido - dt);
    guardado.mejoraSuper = (guardado.mejoras.super || 0) * 0.35;
    if (this.estado === "carga") {
      return;
    } else if (this.estado === "titulo") {
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
      if (input.confirmar() && this.menu + 1 <= guardado.desbloqueado) {
        this.mundoSeleccionado = this.menu + 1;
        this.subMenu = 0;
        this.cambiar("submundo");
      }
      if (input.consumir("KeyT")) this.cambiar("tienda");
      if (input.consumir("KeyL")) this.cambiar("leaderboard");
      if (input.consumir("KeyG")) this.cambiar("logros");
      if (input.consumir("KeyS")) this.cambiar("configuracion");
    } else if (this.estado === "submundo") {
      if (input.arriba()) this.subMenu = Math.max(0, this.subMenu - 1);
      if (input.abajo()) this.subMenu = Math.min(2, this.subMenu + 1);
      if (input.confirmar() && subnivelDesbloqueado(this.mundoSeleccionado, this.subMenu + 1)) this.iniciarNivel(this.mundoSeleccionado, this.subMenu + 1);
      if (input.atras()) this.cambiar("mapa");
    } else if (this.estado === "tienda") {
      if (input.arriba()) this.menu = Math.max(0, this.menu - 1);
      if (input.abajo()) this.menu = Math.min(ITEMS_TIENDA.length - 1, this.menu + 1);
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
      if (input.arriba()) this.pausaMenu = Math.max(0, this.pausaMenu - 1);
      if (input.abajo()) this.pausaMenu = Math.min(3, this.pausaMenu + 1);
      if (input.atras()) this.cambiar("jugar");
      if (input.confirmar()) {
        if (this.pausaMenu === 0) this.cambiar("jugar");
        if (this.pausaMenu === 1) this.reiniciarNivel();
        if (this.pausaMenu === 2) this.cambiar("mapa");
        if (this.pausaMenu === 3) this.cambiar("configuracion");
      }
    } else if (this.estado === "derrota") {
      if (input.confirmar()) { this.vidas = 3; this.puntos = 0; this.extraVida = false; this.cambiar("mapa"); }
    } else if (this.estado === "resultados") {
      if (input.confirmar()) this.cambiar("mapa");
    } else if (this.estado === "ingresar_nombre") {
      this.actualizarIngresoNombre();
    } else if (this.estado === "leaderboard") {
      if (input.confirmar()) { this.confirmarResetTabla = false; this.cambiar("mapa"); }
      if (input.consumir("KeyR")) {
        if (this.confirmarResetTabla) {
          limpiarLeaderboard();
          this.entradaLeaderboard = null;
          this.confirmarResetTabla = false;
        } else {
          this.confirmarResetTabla = true;
        }
      }
    } else if (this.estado === "logros") {
      if (input.confirmar() || input.atras()) this.cambiar("mapa");
    } else if (this.estado.startsWith("cinematica_")) {
      this.actualizarCinematica(dt);
    }
  },

  actualizarCinematica(dt) {
    if (!this.cinematica) return;
    this.cinematica.actualizar(dt);
    const saltable = this.estado !== "cinematica_jefe" || this.cinematica.tiempo > 0.5;
    if (saltable && input.cualquierPulso()) this.cinematica.saltar();
    if (this.cinematica.terminada) {
      if (this.estado === "cinematica_intro") {
        guardado.introVista = true;
        persistir();
      }
      const siguiente = this.siguienteEstadoCinematica;
      this.cinematica = null;
      this.cambiar(siguiente);
    }
  },

  actualizarIngresoNombre() {
    const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let idx = letras.indexOf(this.letraActual);
    if (input.izq()) this.letraActual = letras[(idx + letras.length - 1) % letras.length];
    if (input.der()) this.letraActual = letras[(idx + 1) % letras.length];
    if (input.consumir("Backspace")) this.nombreEntrada = this.nombreEntrada.slice(0, -1);
    if (input.consumir("Space") && this.nombreEntrada.length > 0) this.confirmarNombre();
    if (input.confirmar()) {
      if (this.nombreEntrada.length < 12) this.nombreEntrada += this.letraActual;
      else this.confirmarNombre();
    }
  },

  confirmarNombre() {
    const nombre = this.nombreEntrada || "TACITA";
    guardado.nombreJugador = nombre;
    guardado.mostrarNombre = true;
    persistir();
    const pos = agregarPuntaje(nombre, this.puntos, this.mundo, this.resultado.grado);
    this.posicionPendiente = pos;
    this.entradaLeaderboard = { nombre: nombre.toUpperCase().slice(0, 12), puntos: this.puntos };
    this.cambiar("leaderboard");
  },

  actualizarJuego(dt) {
    this.tiempo += dt;
    this.comboTiempo -= dt;
    if (this.comboTiempo <= 0) this.combo += (1 - this.combo) * (0.04 / (1 + (guardado.mejoras.combo || 0) * 0.45));
    this.jugador.actualizar(dt, this);
    for (const n of this.notificaciones) n.vida -= dt;
    this.notificaciones = this.notificaciones.filter(n => n.vida > 0);
    if (["aereo", "submarino"].includes(this.nivel.modo)) this.jugador.x += (this.nivel.submarino ? 65 : 92) * dt;
    this.camara.seguir(this.jugador, this.nivel.ancho);
    this.camara.actualizar(dt);
    for (const e of this.nivel.enemigos) e.actualizar?.(dt, this);
    this.nivel.jefe?.actualizar(dt, this);
    this.balas.actualizar(dt, this);
    this.particulas.actualizar(dt);
    this.recogerMonedas();
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
      if (this.estado === "pausa") dibujarPausa(g, this);
    } else if (this.estado === "titulo") dibujarTitulo(g, this);
    else if (this.estado === "personaje") dibujarSeleccion(g, this);
    else if (this.estado === "mapa") dibujarMapa(g, this);
    else if (this.estado === "submundo") dibujarSubmundo(g, this);
    else if (this.estado === "tienda") dibujarTienda(g, this);
    else if (this.estado === "configuracion") dibujarConfiguracion(g, this);
    else if (this.estado === "derrota") dibujarDerrota(g, this);
    else if (this.estado === "resultados") dibujarResultados(g, this);
    else if (this.estado === "ingresar_nombre") dibujarIngresoNombre(g, this);
    else if (this.estado === "leaderboard") dibujarLeaderboard(g, this);
    else if (this.estado === "logros") dibujarLogros(g, this);
    else if (this.estado.startsWith("cinematica_")) this.cinematica?.dibujar(g);
    else if (this.estado === "carga") dibujarCarga(g, this);
    dibujarNotificaciones(g, this);
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
  g.fillRect(x0, 0, ANCHO, ALTO);
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
      g.strokeStyle = "#31502e";
      g.lineWidth = 5;
      for (let x = p.x + 35; x < p.x + p.w; x += 95) {
        g.beginPath(); g.moveTo(x, p.y); g.quadraticCurveTo(x + 18, p.y - 34, x + 42, p.y - 6); g.stroke();
      }
    }
    if (n.id === 3) {
      g.fillStyle = "#f1dfb8";
      for (let x = p.x + 25; x < p.x + p.w; x += 60) { g.beginPath(); g.arc(x, p.y + 13, 8, 0, TAU); g.fill(); }
    }
  }
}

function dibujarParallax(g, n, x0, t) {
  if (n.id === 1) dibujarSelva(g, x0, t);
  else if (n.id === 2) dibujarCielos(g, x0, t);
  else if (n.id === 3) dibujarCasino(g, x0, t);
  else if (n.id === 4) dibujarOceano(g, x0, t);
  else dibujarFabrica(g, x0, t);
}

function dibujarSelva(g, x0, t) {
  g.save();
  g.globalAlpha = 0.18;
  g.fillStyle = "#ffe68a";
  for (let i = 0; i < 6; i++) {
    g.beginPath();
    g.moveTo(x0 + i * 180, 0);
    g.lineTo(x0 + i * 180 + 80, 0);
    g.lineTo(x0 + i * 180 - 120, 720);
    g.lineTo(x0 + i * 180 - 230, 720);
    g.fill();
  }
  g.restore();
  for (let capa = 1; capa <= 3; capa++) {
    g.save();
    g.globalAlpha = 0.24 + capa * 0.08;
    for (let i = -2; i < 12; i++) {
      const x = x0 + i * 185 - (x0 * 0.08 * capa) % 185;
      const y = 230 + capa * 95;
      g.fillStyle = "#5b3b25";
      g.fillRect(x - 12, y, 24, 380);
      g.fillStyle = capa === 3 ? "#42683c" : "#345b34";
      for (let j = 0; j < 4; j++) {
        g.beginPath();
        g.arc(x - 42 + j * 28, y - 8 + Math.sin(t + i + j) * 5, 35, 0, TAU);
        g.fill();
      }
    }
    g.restore();
  }
}

function dibujarCielos(g, x0, t) {
  g.save();
  g.fillStyle = "#ffd17a";
  g.beginPath();
  g.arc(x0 + 820, 105, 72, 0, TAU);
  g.fill();
  g.restore();
  for (let capa = 1; capa <= 3; capa++) {
    g.save();
    g.globalAlpha = 0.24 + capa * 0.12;
    g.fillStyle = capa === 1 ? "#ffe2bd" : "#fff1d4";
    for (let i = -2; i < 11; i++) {
      const x = x0 + i * 230 - ((x0 * 0.12 * capa + t * 24 * capa) % 230);
      const y = 120 + capa * 115 + Math.sin(t + i) * 12;
      g.beginPath(); g.ellipse(x, y, 78, 25, 0, 0, TAU); g.fill();
      g.beginPath(); g.ellipse(x + 45, y - 10, 44, 20, 0, 0, TAU); g.fill();
    }
    g.restore();
  }
  g.save();
  g.strokeStyle = "rgba(255,244,214,0.45)";
  g.lineWidth = 4;
  for (let i = 0; i < 12; i++) {
    const y = 100 + i * 45;
    const x = x0 + ((t * 180 + i * 130) % 1100) - 80;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 65, y - 18, x + 150, y); g.stroke();
  }
  g.restore();
}

function dibujarCasino(g, x0, t) {
  g.save();
  g.fillStyle = "#8b1f2f";
  g.fillRect(x0, 0, 45, 720);
  g.fillRect(x0 + ANCHO - 45, 0, 45, 720);
  for (let i = 0; i < 24; i++) {
    const x = x0 + 60 + i * 110 - (x0 * 0.18) % 110;
    const y = 90 + (i % 5) * 95;
    g.fillStyle = Math.sin(t * 5 + i) > 0 ? "#ffef9b" : "#9b2f24";
    g.beginPath();
    for (let k = 0; k < 5; k++) {
      const a = -Math.PI / 2 + k * TAU / 5;
      g.lineTo(x + Math.cos(a) * 18, y + Math.sin(a) * 18);
      g.lineTo(x + Math.cos(a + TAU / 10) * 7, y + Math.sin(a + TAU / 10) * 7);
    }
    g.closePath(); g.fill();
    g.fillStyle = "#f1dfb8";
    g.beginPath(); g.roundRect(x + 35, y + 25, 28, 28, 5); g.fill();
    g.fillStyle = "#d8a342";
    g.beginPath(); g.arc(x - 40, y + 35, 14, 0, TAU); g.fill();
  }
  g.restore();
}

function dibujarOceano(g, x0, t) {
  g.save();
  const luz = g.createRadialGradient(x0 + 480, -30, 20, x0 + 480, 20, 650);
  luz.addColorStop(0, "rgba(185,230,255,0.55)");
  luz.addColorStop(1, "rgba(185,230,255,0)");
  g.fillStyle = luz;
  g.fillRect(x0, 0, ANCHO, ALTO);
  for (let i = 0; i < 34; i++) {
    const x = x0 + ((i * 97 - x0 * 0.2) % 1100);
    const y = ((650 - (t * (30 + i % 5 * 8) + i * 51) % 720) + 720) % 720;
    g.strokeStyle = "rgba(208,244,255,0.45)";
    g.lineWidth = 2;
    g.beginPath(); g.arc(x, y, 4 + i % 4, 0, TAU); g.stroke();
  }
  g.strokeStyle = "#173b32";
  g.lineWidth = 6;
  for (let i = -1; i < 14; i++) {
    const x = x0 + i * 90 - (x0 * 0.1) % 90;
    g.beginPath();
    g.moveTo(x, 680);
    g.quadraticCurveTo(x + Math.sin(t * 2 + i) * 35, 570, x + 10, 480);
    g.stroke();
    g.fillStyle = "#e18e59";
    g.beginPath(); g.ellipse(x + 45, 280 + Math.sin(t + i) * 30, 18, 7, 0, 0, TAU); g.fill();
  }
  g.restore();
}

function dibujarFabrica(g, x0, t) {
  g.save();
  g.strokeStyle = "#5d5044";
  g.lineWidth = 18;
  for (let i = 0; i < 8; i++) {
    const x = x0 + i * 170 - (x0 * 0.12) % 170;
    g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 720); g.stroke();
    g.beginPath(); g.moveTo(x - 80, 180 + i % 3 * 110); g.lineTo(x + 120, 180 + i % 3 * 110); g.stroke();
  }
  for (let i = 0; i < 8; i++) {
    const x = x0 + 90 + i * 135 - (x0 * 0.16) % 135;
    const y = 120 + (i % 4) * 105;
    g.save();
    g.translate(x, y);
    g.rotate(t * (i % 2 ? -1 : 1));
    g.strokeStyle = "#8f8a74";
    g.lineWidth = 8;
    g.beginPath(); g.arc(0, 0, 32, 0, TAU); g.stroke();
    for (let k = 0; k < 10; k++) {
      const a = k / 10 * TAU;
      g.beginPath(); g.moveTo(Math.cos(a) * 34, Math.sin(a) * 34); g.lineTo(Math.cos(a) * 48, Math.sin(a) * 48); g.stroke();
    }
    g.restore();
  }
  g.fillStyle = "rgba(255,120,45,0.45)";
  for (let i = 0; i < 18; i++) {
    const x = x0 + i * 65;
    g.beginPath();
    g.moveTo(x, 720);
    g.quadraticCurveTo(x + 20, 650 - Math.sin(t * 8 + i) * 25, x + 40, 720);
    g.fill();
  }
  g.strokeStyle = "rgba(255,210,130,0.16)";
  g.lineWidth = 2;
  for (let y = 40; y < 170; y += 18) {
    g.beginPath();
    g.moveTo(x0 - 80, y + Math.sin(t * 5 + y) * 4);
    g.lineTo(x0 + 1040, y + Math.cos(t * 5 + y) * 4);
    g.stroke();
  }
  g.restore();
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

function dibujarNotificaciones(g, juego) {
  juego.notificaciones.forEach((n, i) => {
    g.save();
    const p = Math.min(1, n.vida / 0.35);
    g.globalAlpha = Math.min(1, n.vida);
    tinta(g, "rgba(29,18,13,0.88)", "#ffef9b", 4);
    g.beginPath();
    g.roundRect(610 + (1 - p) * 220, 86 + i * 58, 310, 46, 8);
    g.fill();
    g.stroke();
    texto(g, n.texto, 765 + (1 - p) * 220, 109 + i * 58, 20, "center", "#ffef9b");
    g.restore();
  });
}

function dibujarLogros(g, juego) {
  const grad = g.createLinearGradient(0, 0, 0, ALTO);
  grad.addColorStop(0, "#6f563d");
  grad.addColorStop(1, "#211611");
  g.fillStyle = grad;
  g.fillRect(0, 0, ANCHO, ALTO);
  texto(g, "LOGROS", 480, 72, 56, "center", "#ffef9b");
  Object.entries(DEFINICIONES_LOGROS).forEach(([id, logro], i) => {
    const y = 155 + i * 70;
    const abierto = juego.logros.desbloqueados[id];
    tinta(g, abierto ? "#d8a342" : "#5d5044", "#1a100c", 4);
    g.beginPath();
    g.arc(190, y, 24, 0, TAU);
    g.fill();
    g.stroke();
    texto(g, abierto ? "OK" : "?", 190, y, 17, "center", "#1a100c");
    texto(g, logro.nombre, 430, y - 8, 28, "left", abierto ? "#f4e3bd" : "#9b8a6c");
    texto(g, abierto ? `Desbloqueado ${abierto}` : "Pendiente", 430, y + 22, 18, "left", abierto ? "#ffef9b" : "#8e8576");
  });
  texto(g, "ENTER/ESC: MAPA", 480, 650, 24);
}

function dibujarCarga(g, juego) {
  g.fillStyle = "#211611";
  g.fillRect(0, 0, ANCHO, ALTO);
  texto(g, "Preparando la tinta...", 480, 265 + Math.sin(juego.t * 5) * 4, 38, "center", "#f1dfb8");
  tinta(g, "#3b2921", "#1a100c", 5);
  g.beginPath();
  g.roundRect(250, 350, 460, 36, 8);
  g.fill();
  g.stroke();
  g.fillStyle = "#d8a342";
  g.fillRect(258, 358, 444 * juego.cargaProgreso, 20);
  const x = 258 + 444 * juego.cargaProgreso;
  g.fillStyle = "#f3e1bd";
  g.strokeStyle = "#1a100c";
  g.lineWidth = 4;
  g.beginPath();
  g.ellipse(x, 330 + Math.sin(juego.t * 16) * 5, 18, 22, 0, 0, TAU);
  g.fill();
  g.stroke();
}

window.juegoPorcelana = juego;
juego.iniciar();
