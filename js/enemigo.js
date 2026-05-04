import { ESTADOS_IA, actualizarIA, predecirJugador } from "./ia.js";
import { TAU, aabb, rand, tinta } from "./util.js";
import { sprites } from "../sprites/sprites.js";

const DATOS = {
  rana: { hp: 26, velocidad: 85, color: "#6d9a4b", terrestre: true },
  pajaro: { hp: 18, velocidad: 70, volador: true, dispara: true },
  hongo: { hp: 22, velocidad: 65, gira: true },
  tortuga: { hp: 34, velocidad: 42, dispara: true },
  avioneta: { hp: 20, velocidad: 90, volador: true, dispara: true },
  globo: { hp: 18, velocidad: 55, volador: true, explota: true },
  nube: { hp: 26, velocidad: 50, volador: true, dispara: true },
  murcielago: { hp: 16, velocidad: 115, volador: true },
  naipe: { hp: 16, velocidad: 90, volador: true, dispara: true, rosa: true },
  ficha: { hp: 24, velocidad: 120, rueda: true },
  tragamonedas: { hp: 36, velocidad: 20, dispara: true },
  pez: { hp: 18, velocidad: 85, volador: true, explota: true },
  medusa: { hp: 24, velocidad: 45, volador: true, dispara: true },
  cangrejo: { hp: 30, velocidad: 45, dispara: true },
  anguila: { hp: 20, velocidad: 120, volador: true },
  clon: { hp: 22, velocidad: 150, dispara: true }
};

export class Enemigo {
  constructor(tipo, x, y, zona = [x - 180, x + 180]) {
    const datos = DATOS[tipo] || DATOS.rana;
    Object.assign(this, datos);
    this.tipo = tipo;
    this.x = x;
    this.y = y;
    this.baseY = y;
    this.w = tipo === "tragamonedas" ? 54 : 44;
    this.h = tipo === "tragamonedas" ? 56 : 42;
    this.hp = datos.hp;
    this.maxHp = datos.hp;
    this.zona = zona;
    this.activo = true;
    this.t = rand(0, 10);
    this.vx = 0;
    this.vy = 0;
    this.direccion = -1;
    this.estado = ESTADOS_IA.PATRULLAR;
    this.estadoTiempo = 0;
    this.cooldown = rand(0.4, 1.8);
    this.golpesRapidos = 0;
    this.ventanaGolpe = 0;
    this.aturdido = 0;
    this.flash = 0;
    this.carga = 0;
    this.patrullaVel = rand(0.7, 1.8);
    this.patrullaAmp = rand(35, 90);
  }

  rect() {
    return { x: this.x - this.w / 2, y: this.y - this.h / 2, w: this.w, h: this.h };
  }

  recibir(dano, juego) {
    this.hp -= dano;
    this.flash = 0.12;
    this.ventanaGolpe = 0.8;
    this.golpesRapidos++;
    if (this.golpesRapidos >= 3) {
      this.aturdido = 1.5;
      this.golpesRapidos = 0;
    }
    juego.particulas.estallido(this.x, this.y, "#fff6dd", 4, 120);
    if (this.hp <= 0) this.morir(juego);
  }

  morir(juego) {
    if (!this.activo) return;
    this.activo = false;
    juego.sumarPuntos(180);
    juego.particulas.estallido(this.x, this.y, "#d8a342", 8, 260, true);
    juego.audio.sfx("muerte");
  }

  actualizar(dt, juego) {
    if (!this.activo) return;
    this.t += dt;
    this.flash = Math.max(0, this.flash - dt);
    this.ventanaGolpe = Math.max(0, this.ventanaGolpe - dt);
    if (this.ventanaGolpe <= 0) this.golpesRapidos = 0;
    actualizarIA(this, juego, dt);

    if (this.volador) this.y = this.baseY + Math.sin(this.t * (this.tipo === "anguila" ? 6 : 3.4)) * (this.tipo === "anguila" ? 55 : 42);
    if (this.tipo === "rana") this.saltoRana(dt);
    if (this.tipo === "ficha") this.x -= this.velocidad * dt;

    if (this.estado === ESTADOS_IA.ATACAR) this.atacar(juego);
    if (aabb(this.rect(), juego.jugador.rect())) {
      if (this.explota) this.morir(juego);
      juego.jugador.herir(juego);
    }
    if (this.x < juego.camara.x - 180 && !this.dispara) this.activo = false;
  }

  saltoRana(dt) {
    if (Math.abs(this.vy) < 1 && this.cooldown <= 0) {
      this.vy = -430;
      this.cooldown = 1.5;
    }
    this.vy += 1100 * dt;
    this.y += this.vy * dt;
    if (this.y > this.baseY) {
      this.y = this.baseY;
      this.vy = 0;
    }
  }

  atacar(juego) {
    if (this.carga <= 0) this.carga = 0.5;
    this.carga -= juego.dt;
    if (this.carga > 0) return;
    const objetivo = this.volador ? predecirJugador(this, juego.jugador) : juego.jugador;
    const dx = objetivo.x - this.x;
    const dy = objetivo.y - this.y;
    const len = Math.hypot(dx, dy) || 1;
    const velocidad = this.rosa ? 260 : 230;
    juego.balas.crear("enemigo", this.x, this.y, dx / len * velocidad, dy / len * velocidad, {
      color: this.rosa ? "#ff8abf" : "#cf3f38",
      rosa: this.rosa,
      dano: 1
    });
    this.cooldown = rand(0.85, 1.65);
    this.carga = 0;
  }

  dibujar(g, t) {
    if (!this.activo) return;
    g.save();
    g.translate(this.x, this.y);
    g.scale(this.direccion, 1);
    const carga = this.carga > 0 ? 1 + Math.sin(t * 28) * 0.12 : 1;
    const squash = this.aturdido > 0 ? 0.82 + Math.sin(t * 30) * 0.08 : 1 + Math.sin(this.t * 10) * 0.035;
    g.rotate((this.gira || this.rueda ? this.t * 3 : Math.sin(this.t * 8) * 0.04));
    g.scale(carga / squash, squash);
    const img = sprites.enemigos[this.tipo] || sprites.enemigos.rana;
    g.drawImage(img, -35, -31, 70, 62);
    if (this.flash > 0) {
      g.globalCompositeOperation = "source-atop";
      g.fillStyle = "rgba(255,255,255,0.75)";
      g.fillRect(-40, -40, 80, 80);
    }
    if (this.carga > 0) {
      tinta(g, "rgba(255,235,150,0.35)", "#ffef9b", 3);
      g.beginPath(); g.arc(0, 0, 38 + Math.sin(t * 20) * 4, 0, TAU); g.stroke();
    }
    g.restore();
  }
}
