import { input } from "./input.js";
import { TAU, clamp, lerp } from "./util.js";
import { sprites } from "../sprites/sprites.js";

export const PERSONAJES = {
  tacita: { nombre: "TACITA", descripcion: "Balanceada", hp: 3, saltos: 2, cadencia: 0.115, bala: 650, dash: 720, color: "#f3e1bd" },
  platon: { nombre: "PLATON", descripcion: "Tanque", hp: 4, saltos: 2, cadencia: 0.16, bala: 590, dash: 840, color: "#d8e6d0" },
  tetito: { nombre: "TETITO", descripcion: "Agil", hp: 2, saltos: 3, cadencia: 0.095, bala: 760, dash: 690, color: "#f0c2df" }
};

export class Jugador {
  constructor(tipo = "tacita") {
    this.tipo = tipo;
    this.reset();
  }

  configurar(tipo, guardado) {
    this.tipo = tipo;
    this.guardado = guardado;
    this.reset();
  }

  reset() {
    const p = PERSONAJES[this.tipo] || PERSONAJES.tacita;
    const mejoras = this.guardado?.mejoras || { vida: 0, cadencia: 0, velocidad: 0, super: 0, escudo: 0 };
    Object.assign(this, {
      x: 110, y: 520, w: 38, h: 58, vx: 0, vy: 0, direccion: 1,
      maxHp: p.hp + mejoras.vida, hp: p.hp + mejoras.vida,
      saltosMax: p.saltos, saltos: 0, enSuelo: false, inv: 0,
      dash: 0, dashCd: 0, disparoCd: 0, estado: "idle", aereo: false,
      super: mejoras.super * 12, parries: 0, golpes: 0, disparos: 0, aciertos: 0,
      aimX: 1, aimY: 0, muerto: false, victoria: false, fantasmas: [],
      muerteRot: 0, sombrero: 0, aura: 0, escudos: mejoras.escudo || 0
    });
  }

  rect() {
    return { x: this.x - this.w / 2, y: this.y - this.h / 2, w: this.w, h: this.h };
  }

  herir(juego) {
    if (this.inv > 0 || this.muerto) return;
    if (this.escudos > 0) {
      this.escudos--;
      this.inv = 0.9;
      this.estado = "golpeado";
      juego.camara.golpear(10);
      juego.particulas.estallido(this.x, this.y, "#241914", 24, 240);
      juego.audio.sfx("parry");
      return;
    }
    this.hp--;
    this.golpes++;
    this.inv = 1.4;
    this.estado = "golpeado";
    juego.camara.golpear(16);
    juego.audio.sfx("golpe");
    juego.particulas.estallido(this.x, this.y, "#f3e1bd", 18, 240);
    if (this.hp <= 0) this.morir(juego);
  }

  morir(juego) {
    this.muerto = true;
    this.estado = "muerte";
    juego.vidas--;
    juego.audio.sfx("muerte");
    juego.particulas.estallido(this.x, this.y, "#e8d0a4", 30, 340, true);
    setTimeout(() => {
      if (juego.vidas < 0) juego.derrota();
      else juego.reiniciarNivel();
    }, 950);
  }

  parry(juego) {
    this.estado = "parry";
    this.vy = this.aereo ? -130 : -430;
    this.parries++;
    this.super = clamp(this.super + 25, 0, 100);
    juego.sumarPuntos(250);
    juego.particulas.estallido(this.x, this.y, "#ff8abf", 18, 230);
    juego.audio.sfx("parry");
  }

  actualizar(dt, juego) {
    if (this.muerto) {
      this.muerteRot += dt * 9;
      this.y += 180 * dt;
      return;
    }
    this.inv = Math.max(0, this.inv - dt);
    this.dashCd = Math.max(0, this.dashCd - dt);
    this.disparoCd = Math.max(0, this.disparoCd - dt);
    this.aura = Math.max(0, this.aura - dt);
    const mx = clamp(input.x(), -1, 1);
    const my = clamp(input.y(), -1, 1);
    if (Math.abs(mx) > 0.1) this.direccion = Math.sign(mx);
    const len = Math.hypot(mx, my);
    if (len > 0.15) {
      this.aimX = mx / len;
      this.aimY = my / len;
    } else {
      this.aimX = this.direccion;
      this.aimY = 0;
    }
    if (this.aereo) this.actualizarAereo(dt, mx, my, juego);
    else this.actualizarPlataforma(dt, mx, juego);

    if (input.dash() && this.dashCd <= 0) this.iniciarDash(juego);
    const dashPrevio = this.dash;
    if (this.dash > 0) {
      this.dash -= dt;
      this.fantasmas.push({ x: this.x, y: this.y, dir: this.direccion, vida: 0.22 });
      while (this.fantasmas.length > 5) this.fantasmas.shift();
    }
    if (dashPrevio > 0 && this.dash <= 0 && (this.guardado?.mejoras?.dashCargado || 0) > 0) {
      juego.particulas.estallido(this.x, this.y, "#ffef9b", 24, 280);
    }
    this.fantasmas.forEach(f => f.vida -= dt);
    this.fantasmas = this.fantasmas.filter(f => f.vida > 0);

    if ((input.disparoMantenido() || input.disparoPulso()) && this.disparoCd <= 0) this.disparar(juego);
    if (input.super() && this.super >= 100) this.superAtaque(juego);
  }

  actualizarPlataforma(dt, mx, juego) {
    const p = PERSONAJES[this.tipo];
    const mejoras = this.guardado?.mejoras || { velocidad: 0 };
    const velocidad = 250 + mejoras.velocidad * 28;
    this.vx = this.dash > 0 ? this.vx : lerp(this.vx, mx * velocidad, 0.18);
    if (input.salto() && this.saltos < this.saltosMax) {
      this.vy = -520;
      this.saltos++;
      this.enSuelo = false;
      this.estado = "saltar";
      this.sombrero = 0.35;
      juego.audio.sfx("salto");
    }
    this.vy += 1500 * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.enSuelo = false;
    for (const plat of juego.nivel.plataformas) {
      const r = this.rect();
      if (r.x < plat.x + plat.w && r.x + r.w > plat.x && r.y < plat.y + plat.h && r.y + r.h > plat.y && this.vy >= 0 && r.y + r.h - this.vy * dt <= plat.y + 8) {
        this.y = plat.y - this.h / 2;
        this.vy = 0;
        this.enSuelo = true;
        this.saltos = 0;
      }
    }
    if (this.y > 800) this.herir(juego);
    this.x = clamp(this.x, 35, juego.nivel.ancho - 35);
    if (this.estado !== "disparar" && this.estado !== "parry" && this.estado !== "golpeado") {
      if (!this.enSuelo) this.estado = this.vy < 0 ? "saltar" : "caer";
      else this.estado = Math.abs(this.vx) > 25 ? "correr" : "idle";
    }
    if (p) this.sombrero = Math.max(0, this.sombrero - dt);
  }

  actualizarAereo(dt, mx, my, juego) {
    const fluidez = juego.nivel.submarino ? 0.08 : 0.14;
    const velocidad = juego.nivel.submarino ? 220 : 290;
    this.vx = lerp(this.vx, mx * velocidad, fluidez);
    this.vy = lerp(this.vy, my * velocidad, fluidez);
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.x = clamp(this.x, juego.camara.x + 45, juego.camara.x + 915);
    this.y = clamp(this.y, 70, 650);
    this.estado = "idle";
  }

  iniciarDash(juego) {
    const p = PERSONAJES[this.tipo];
    this.dash = 0.16;
    this.dashCd = 0.65;
    this.vx = this.direccion * p.dash;
    this.inv = Math.max(this.inv, 0.18);
    this.estado = "dash";
    juego.audio.sfx("dash");
  }

  disparar(juego) {
    const p = PERSONAJES[this.tipo];
    const mejoras = this.guardado?.mejoras || { cadencia: 0 };
    this.disparoCd = Math.max(0.055, p.cadencia - mejoras.cadencia * 0.012);
    this.disparos++;
    this.estado = "disparar";
    const doble = (mejoras.doble || 0) > 0;
    const offsets = doble ? [-8, 8] : [0];
    for (const off of offsets) {
      juego.balas.crear("jugador", this.x + this.aimX * 32, this.y + this.aimY * 22 + off, this.aimX * p.bala, this.aimY * p.bala, {
        color: "#f5d66c", w: 16, h: 10, dano: 5, vida: 1.8, rebotes: mejoras.rebote || 0
      });
    }
    juego.audio.sfx("disparo");
  }

  superAtaque(juego) {
    this.super = 0;
    this.estado = "super";
    this.aura = 0.8;
    juego.camara.superDestello();
    juego.audio.sfx("super");
    for (let i = 0; i < 32; i++) {
      const a = i / 32 * TAU;
      juego.balas.crear("jugador", this.x, this.y, Math.cos(a) * 560, Math.sin(a) * 560, {
        color: "#ffef9b", w: 22, h: 22, dano: 18, vida: 1.5
      });
    }
  }

  dibujar(g, t) {
    for (const f of this.fantasmas) {
      g.save();
      g.globalAlpha = f.vida / 0.5;
      g.translate(f.x, f.y);
      g.scale(f.dir, 1);
      g.drawImage(sprites.jugador[this.tipo].idle[0], -43, -56, 86, 98);
      g.restore();
    }
    if (this.inv > 0 && Math.floor(t * 24) % 2 === 0) return;
    g.save();
    g.translate(this.x, this.y);
    if (this.estado === "muerte") g.rotate(this.muerteRot);
    g.scale(this.direccion, 1);
    const wob = Math.sin(t * 12) * (this.estado === "idle" ? 0.025 : 0.06);
    g.rotate(wob);
    if (this.aura > 0) {
      g.save();
      g.globalAlpha = this.aura;
      g.strokeStyle = "#ffef9b";
      g.lineWidth = 7;
      g.beginPath();
      g.arc(0, -10, 58 + Math.sin(t * 18) * 8, 0, TAU);
      g.stroke();
      g.restore();
    }
    if (this.aereo) {
      g.drawImage(sprites.plano, -51, -33, 102, 66);
      g.strokeStyle = "#f8e7b7";
      g.lineWidth = 3;
      g.beginPath();
      g.arc(38, -2, 18 + Math.sin(t * 40) * 4, 0, TAU);
      g.stroke();
    } else {
      const estado = sprites.jugador[this.tipo][this.estado] ? this.estado : "idle";
      const lista = sprites.jugador[this.tipo][estado];
      const frame = Math.floor(t * (estado === "correr" ? 14 : 8)) % lista.length;
      g.drawImage(lista[frame], -43, -56, 86, 98);
      if (this.sombrero > 0) {
        g.strokeStyle = "#1a100c";
        g.fillStyle = "#b72f2a";
        g.lineWidth = 3;
        g.beginPath();
        g.ellipse(0, -78 - this.sombrero * 30, 18, 7, Math.sin(t * 10), 0, TAU);
        g.fill();
        g.stroke();
      }
    }
    g.restore();
    g.save();
    g.strokeStyle = "#f5d66c";
    g.lineWidth = 3;
    g.setLineDash([8, 8]);
    g.beginPath();
    g.moveTo(this.x, this.y - 10);
    g.lineTo(this.x + this.aimX * 64, this.y - 10 + this.aimY * 64);
    g.stroke();
    g.restore();
  }
}
