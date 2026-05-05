import { input } from "./input.js";
import { TAU, aabb, clamp, lerp } from "./util.js";
import { sprites } from "../sprites/sprites.js";

export const PERSONAJES = {
  tacita: { nombre: "TACITA", descripcion: "Balanceada", hp: 3, saltos: 2, cadencia: 0.115, bala: 650, dash: 720, color: "#f3e1bd" },
  platon: { nombre: "PLATON", descripcion: "Tanque", hp: 4, saltos: 2, cadencia: 0.16, bala: 590, dash: 840, color: "#d8e6d0" },
  tetito: { nombre: "TETITO", descripcion: "Agil", hp: 2, saltos: 3, cadencia: 0.095, bala: 760, dash: 690, color: "#f0c2df" },
  jarron: { nombre: "JARRON", descripcion: "Mago", hp: 2, saltos: 2, cadencia: 0.18, bala: 580, dash: 640, color: "#8b6cc8", especial: "magia" },
  termo: { nombre: "TERMO", descripcion: "Berserker", hp: 5, saltos: 1, cadencia: 0.22, bala: 520, dash: 880, color: "#c86c3a", especial: "furia" },
  taza_chica: { nombre: "TACITA JR", descripcion: "Veloz", hp: 2, saltos: 3, cadencia: 0.07, bala: 820, dash: 750, color: "#6cb8c8", especial: "rapido" }
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
      slide: 0, slideCd: 0, melee: 0, meleeCd: 0, dashesAire: 0, dashAzul: 0,
      autoRunCd: 0,
      super: mejoras.super * 12, parries: 0, golpes: 0, disparos: 0, aciertos: 0,
      aimX: 1, aimY: 0, muerto: false, victoria: false, fantasmas: [],
      muerteRot: 0, sombrero: 0, aura: 0, escudos: mejoras.escudo || 0, polvoCd: 0
    });
  }

  rect() {
    const h = this.slide > 0 ? this.h * 0.5 : this.h;
    return { x: this.x - this.w / 2, y: this.y - h / 2, w: this.w, h };
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
    juego.statsActualizar?.("totalMuertes", 1);
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
    juego.statsActualizar?.("totalParries", 1);
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
    this.slideCd = Math.max(0, this.slideCd - dt);
    this.meleeCd = Math.max(0, this.meleeCd - dt);
    this.polvoCd -= dt;
    this.autoRunCd = Math.max(0, this.autoRunCd - dt);
    this.dashAzul = Math.max(0, this.dashAzul - dt);
    if (this.slide > 0) this.slide -= dt;
    if (this.melee > 0) this.melee -= dt;
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
    if (input.consumir("KeyQ") && this.meleeCd <= 0) this.iniciarMelee(juego);
    if (this.aereo) this.actualizarAereo(dt, mx, my, juego);
    else this.actualizarPlataforma(dt, mx, juego);
    if (this.enSuelo && this.estado === "correr" && Math.abs(this.vx) > 200 && this.polvoCd <= 0) {
      juego.particulas.estallido(this.x - this.direccion * 18, this.y + 28, "#d9bd77", 3, 80);
      this.polvoCd = 0.2;
    }
    if (this.slide > 0 && this.polvoCd <= 0) {
      juego.particulas.estallido(this.x - this.direccion * 22, this.y + 25, "#d9bd77", 4, 90);
      this.polvoCd = 0.08;
    }

    if (input.dash()) {
      if (my > 0.45 && this.enSuelo && this.slideCd <= 0) this.iniciarDeslizar(juego);
      else if (this.puedeDashear()) this.iniciarDash(juego, mx, my);
    }
    const dashPrevio = this.dash;
    if (this.dash > 0) {
      this.dash -= dt;
      this.fantasmas.push({ x: this.x, y: this.y, dir: this.direccion, vida: this.dashAzul > 0 ? 0.35 : 0.22, azul: this.dashAzul > 0 });
      while (this.fantasmas.length > (this.dashAzul > 0 ? 8 : 5)) this.fantasmas.shift();
    }
    if (dashPrevio > 0 && this.dash <= 0 && (this.guardado?.mejoras?.dashCargado || 0) > 0) {
      juego.particulas.estallido(this.x, this.y, "#ffef9b", 24, 280);
    }
    this.fantasmas.forEach(f => f.vida -= dt);
    this.fantasmas = this.fantasmas.filter(f => f.vida > 0);

    if ((input.disparoMantenido() || input.disparoPulso()) && this.disparoCd <= 0) this.disparar(juego);
    if ((PERSONAJES[this.tipo].especial === "rapido") && this.estado === "correr" && this.autoRunCd <= 0) {
      this.disparar(juego, true);
      this.autoRunCd = 0.4;
    }
    if (input.super() && this.super >= 100) this.superAtaque(juego);
  }

  actualizarPlataforma(dt, mx, juego) {
    const p = PERSONAJES[this.tipo];
    const mejoras = this.guardado?.mejoras || { velocidad: 0 };
    const velocidad = (250 + mejoras.velocidad * 28) * (juego.powerupsActivos?.velocidad ? 1.6 : 1);
    this.vx = this.dash > 0 || this.slide > 0 ? this.vx : lerp(this.vx, mx * velocidad, 0.18);
    const salto = input.salto();
    if (salto && this.tipo === "tetito" && !this.enSuelo && (this.x <= 45 || this.x >= juego.nivel.ancho - 45)) {
      const lado = this.x <= 45 ? 1 : -1;
      this.vx = lado * 420;
      this.vy = -460;
      juego.particulas.estallido(this.x, this.y + 20, "#f1dfb8", 12, 180);
      juego.audio.sfx("wallJump");
    } else if (salto && this.saltos < this.saltosMax) {
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
        this.dashesAire = 0;
      }
    }
    if (this.y > 700) this.herir(juego);
    this.x = clamp(this.x, 35, juego.nivel.ancho - 35);
    if (this.estado !== "disparar" && this.estado !== "parry" && this.estado !== "golpeado") {
      if (this.slide > 0) this.estado = "deslizar";
      else if (this.melee > 0) this.estado = "golpe";
      else if (!this.enSuelo) this.estado = this.vy < 0 ? "saltar" : "caer";
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

  puedeDashear() {
    const mejoraDoble = (this.guardado?.mejoras?.velocidad || 0) >= 3;
    if (this.enSuelo || this.aereo) return this.dashCd <= 0;
    return this.dashCd <= 0 || ((this.tipo === "tetito" || mejoraDoble) && this.dashesAire < 1);
  }

  iniciarDash(juego, mx = 0, my = 0) {
    const p = PERSONAJES[this.tipo];
    const aireExtra = !this.enSuelo && this.dashCd > 0;
    this.dash = 0.16;
    this.dashCd = 0.65;
    if (aireExtra) {
      const len = Math.hypot(mx, my) || 1;
      this.vx = mx / len * p.dash;
      this.vy = my / len * p.dash;
      this.dashesAire++;
      this.dashAzul = 0.18;
    } else {
      this.vx = this.direccion * p.dash;
    }
    this.inv = Math.max(this.inv, 0.18);
    this.estado = "dash";
    juego.audio.sfx("dash");
  }

  iniciarDeslizar(juego) {
    this.slide = 0.4;
    this.slideCd = 1.2;
    this.vx = this.direccion * 520;
    this.estado = "deslizar";
    juego.particulas.estallido(this.x, this.y + 26, "#d8a342", 10, 120);
    juego.audio.sfx("deslizar");
  }

  iniciarMelee(juego) {
    this.melee = 0.25;
    this.meleeCd = 0.8;
    this.estado = "golpe";
    const zona = { x: this.x + this.direccion * 30 - 30, y: this.y - 40, w: 60, h: 80 };
    for (const e of juego.nivel.enemigos) if (e.activo && aabb(zona, e.rect())) e.recibir(15, juego);
    if (juego.nivel.jefe?.activo && aabb(zona, juego.nivel.jefe.rect())) juego.nivel.jefe.recibir(15, juego);
    juego.balas.pool.cada(b => {
      if (b.dueno !== "jugador" && b.rosa && Math.hypot(b.x - this.x, b.y - this.y) < 70) {
        b.activo = false;
        this.parry(juego);
      }
    });
    juego.particulas.estallido(this.x + this.direccion * 46, this.y - 8, "#fff6dd", 8, 160);
    juego.audio.sfx("melee");
  }

  disparar(juego, automatico = false) {
    const p = PERSONAJES[this.tipo];
    const mejoras = this.guardado?.mejoras || { cadencia: 0 };
    if (!automatico) this.disparoCd = Math.max(0.055, p.cadencia - mejoras.cadencia * 0.012);
    this.disparos++;
    juego.statsActualizar?.("totalDisparos", 1);
    this.estado = "disparar";
    const doble = (mejoras.doble || 0) > 0 || !!juego.powerupsActivos?.doble_bala;
    const offsets = doble ? [-8, 8] : [0];
    const furia = p.especial === "furia" ? 1 + (1 - this.hp / this.maxHp) * 1.5 : 1;
    for (const off of offsets) {
      juego.balas.crear("jugador", this.x + this.aimX * 32, this.y + this.aimY * 22 + off, this.aimX * p.bala, this.aimY * p.bala, {
        color: p.especial === "magia" ? "#b99cff" : "#f5d66c", w: 16, h: 10, dano: 5 * furia, vida: 1.8, rebotes: mejoras.rebote || 0, atraviesa: p.especial === "magia"
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
    g.setLineDash([]);
    g.lineDashOffset = 0;
    g.beginPath();
    for (const f of this.fantasmas) {
      g.save();
      g.setLineDash([]);
      g.lineDashOffset = 0;
      g.beginPath();
      g.globalAlpha = f.vida / 0.5;
      g.translate(f.x, f.y);
      g.scale(f.dir, 1);
      g.drawImage(sprites.jugador[this.tipo].idle[0], -43, -56, 86, 98);
      if (f.azul) {
        g.globalCompositeOperation = "source-atop";
        g.fillStyle = "rgba(108,166,217,0.55)";
        g.fillRect(-45, -60, 90, 110);
      }
      g.restore();
    }
    if (this.inv > 0 && Math.floor(t * 24) % 2 === 0) return;
    g.save();
    g.setLineDash([]);
    g.lineDashOffset = 0;
    g.beginPath();
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
      if (estado === "idle" && (t % 3.5) < 0.15) {
        g.fillStyle = "#1a100c";
        g.fillRect(-16, -31, 32, 3);
      }
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
    if (this.slide > 0) {
      g.globalAlpha = 0.35;
      g.fillStyle = "#f5d66c";
      g.beginPath(); g.ellipse(-38, 18, 38, 10, 0, 0, TAU); g.fill();
    }
    if (this.melee > 0) {
      g.globalAlpha = Math.min(1, this.melee / 0.25);
      g.strokeStyle = "#fff6dd"; g.lineWidth = 8;
      g.beginPath();
      g.arc(this.direccion * 20, -5, 45, -Math.PI / 4, Math.PI / 4);
      g.stroke();
    }
    g.restore();
  }
}
