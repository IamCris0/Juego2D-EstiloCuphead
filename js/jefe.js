import { registrarPosicionJefe, tacticaRepetida } from "./ia.js";
import { TAU, aabb, rand } from "./util.js";
import { sprites } from "../sprites/sprites.js";

const JEFES = {
  arbol: { nombre: "ARBOL MALVADO", hp: 900, fases: 3, dialogo: ["Mis raices te atraparan", "La selva canta tu derrota", "Ahora caen todas mis hojas"] },
  nube: { nombre: "NUBE TORMENTOSA", hp: 1050, fases: 4, dialogo: ["Trueno listo", "Granizo para todos", "Gira el viento", "Ven al centro"] },
  joker: { nombre: "EL GRAN JOKER", hp: 980, fases: 3, dialogo: ["Barajo tu destino", "Dados cargados", "Mis copias no fallan"] },
  pulpo: { nombre: "PULPO PIRATA", hp: 1250, fases: 5, dialogo: ["Tentaculo uno", "Tentaculo dos", "Tentaculo tres", "Tentaculo cuatro", "Tinta total"] },
  diablo: { nombre: "DIABLO DE PORCELANA", hp: 1700, fases: 6, dialogo: ["Puños de fabrica", "Engranajes vivos", "Fuego en espiral", "Copias rotas", "Todo al reves", "Forma final"] },
  cocodrilo: { nombre: "COCODRILO GIGANTE", hp: 260, fases: 2, dialogo: ["Chasquido", "Cola salvaje"] }
};

export class Jefe {
  constructor(tipo, x, y) {
    const datos = JEFES[tipo];
    Object.assign(this, {
      tipo, nombre: datos.nombre, x, y, baseX: x, baseY: y, w: tipo === "diablo" ? 210 : 168, h: tipo === "diablo" ? 168 : 134,
      hp: datos.hp, maxHp: datos.hp, fasesMax: datos.fases, fase: 1, activo: true,
      t: 0, cooldown: 0.8, transicion: 0, memoria: [], emocion: "burlon", pausa: 0.5,
      dialogo: datos.dialogo[0], final: tipo === "diablo"
    });
  }

  rect() {
    return { x: this.x - this.w / 2, y: this.y - this.h / 2, w: this.w, h: this.h };
  }

  recibir(dano, juego) {
    this.hp -= dano;
    juego.jugador.super = Math.min(100, juego.jugador.super + 2.5);
    juego.particulas.estallido(this.x + rand(-50, 50), this.y + rand(-40, 40), "#f1c36c", 4, 120);
    if (this.hp <= 0) {
      this.activo = false;
      juego.camara.muerteJefe();
      juego.particulas.estallido(this.x, this.y, "#f0c35e", 80, 450, true);
      juego.audio.sfx("victoria");
      juego.completarNivel();
      return;
    }
    const nueva = Math.min(this.fasesMax, Math.floor((1 - this.hp / this.maxHp) * this.fasesMax) + 1);
    if (nueva > this.fase) {
      this.fase = nueva;
      this.transicion = 1.35;
      this.emocion = nueva >= this.fasesMax ? "desesperado" : "enojado";
      this.dialogo = JEFES[this.tipo].dialogo[nueva - 1];
      juego.camara.golpear(30);
      juego.audio.sfx("fase");
    }
  }

  actualizar(dt, juego) {
    if (!this.activo) return;
    this.t += dt;
    this.transicion = Math.max(0, this.transicion - dt);
    registrarPosicionJefe(this, juego.jugador);
    const repetido = tacticaRepetida(this);
    this.x = this.baseX + Math.sin(this.t * (1.1 + this.fase * 0.2)) * (this.tipo === "diablo" ? 45 : 28);
    this.y = this.baseY + Math.sin(this.t * 1.7) * (this.tipo === "pulpo" ? 50 : 70);
    this.cooldown -= dt;
    if (this.cooldown <= 0) this.atacar(juego, repetido);
    if (aabb(this.rect(), juego.jugador.rect())) juego.jugador.herir(juego);
  }

  atacar(juego, castigo) {
    const f = this.fase;
    if (this.tipo === "arbol") {
      if (f === 1) this.abanico(juego, 7, 300, "#7d593c");
      else if (f === 2) this.raices(juego);
      else { this.espiral(juego, 18, "#6c9b4a"); this.teledirigidas(juego, 3, "#7d593c"); }
    } else if (this.tipo === "nube") {
      if (f === 1) this.dirigidos(juego, 3, "#f6e27a", "rayo");
      else if (f === 2) this.lluvia(juego, 12);
      else if (f === 3) this.tornados(juego);
      else { this.absorber(juego); this.espiral(juego, 14, "#7e86a3"); }
    } else if (this.tipo === "joker") {
      if (f === 1) this.abanico(juego, 11, 290, "#f1dfb8", true);
      else if (f === 2) this.dados(juego);
      else { this.teledirigidas(juego, castigo ? 8 : 5, "#f1dfb8"); this.fantasmas(juego); }
    } else if (this.tipo === "pulpo") {
      if (f < 5) this.tentaculo(juego, f);
      else { this.espiral(juego, 22, "#241914"); juego.oscuridad = 0.75; }
    } else if (this.tipo === "diablo") {
      if (f === 1) this.punos(juego);
      else if (f === 2) this.espiral(juego, 12, "#8f8a74");
      else if (f === 3) this.espiral(juego, 22, "#e35331");
      else if (f === 4) this.fantasmas(juego, true);
      else if (f === 5) { juego.invertido = 1.6; this.caos(juego, 14); }
      else this.caos(juego, 28);
    } else {
      if (f === 1) this.dirigidos(juego, 4, "#cf3f38");
      else this.abanico(juego, 9, 330, "#557a45");
    }
    this.cooldown = Math.max(0.35, 1.1 - this.fase * 0.08);
  }

  abanico(juego, cantidad, vel, color, rosa = false) {
    for (let i = 0; i < cantidad; i++) {
      const a = Math.PI + (i - (cantidad - 1) / 2) * 0.18;
      juego.balas.crear("enemigo", this.x - 70, this.y, Math.cos(a) * vel, Math.sin(a) * vel, { color, rosa: rosa && i % 3 === 0 });
    }
  }

  espiral(juego, cantidad, color) {
    for (let i = 0; i < cantidad; i++) {
      const a = this.t * 3 + i / cantidad * TAU;
      juego.balas.crear("enemigo", this.x, this.y, Math.cos(a) * 235, Math.sin(a) * 235, { color, rosa: i % 6 === 0 });
    }
  }

  dirigidos(juego, cantidad, color, tipo = "bala") {
    const p = juego.jugador;
    const base = Math.atan2(p.y - this.y, p.x - this.x);
    for (let i = 0; i < cantidad; i++) {
      const a = base + (i - (cantidad - 1) / 2) * 0.14;
      juego.balas.crear("enemigo", this.x - 50, this.y, Math.cos(a) * 370, Math.sin(a) * 370, { color, tipo, w: tipo === "rayo" ? 26 : 12, h: tipo === "rayo" ? 8 : 12 });
    }
  }

  teledirigidas(juego, cantidad, color) {
    for (let i = 0; i < cantidad; i++) {
      const a = rand(Math.PI * 0.7, Math.PI * 1.3);
      juego.balas.crear("enemigo", this.x + rand(-45, 45), this.y + rand(-35, 35), Math.cos(a) * 170, Math.sin(a) * 170, { color, teledirigida: 1.35, vida: 4 });
    }
  }

  raices(juego) {
    for (let i = 0; i < 5; i++) juego.balas.crear("enemigo", juego.camara.x + 160 + i * 160, 690, 0, -360, { color: "#4f3a22", w: 28, h: 70, vida: 1.4 });
  }

  lluvia(juego, cantidad) {
    for (let i = 0; i < cantidad; i++) juego.balas.crear("enemigo", juego.camara.x + rand(60, 900), -20, rand(-30, 30), rand(260, 430), { color: "#d8d1bd" });
  }

  tornados(juego) {
    for (const lado of [-1, 1]) juego.balas.crear("enemigo", juego.camara.x + (lado < 0 ? -30 : 990), rand(160, 560), lado * -280, 0, { color: "#d8d1bd", w: 46, h: 46 });
  }

  absorber(juego) {
    const p = juego.jugador;
    p.vx += (this.x - p.x) * 0.035;
    p.vy += (this.y - p.y) * 0.035;
  }

  dados(juego) {
    for (let i = 0; i < 3; i++) juego.balas.crear("enemigo", this.x, this.y + i * 22 - 22, -320, rand(-180, 180), { color: "#f1dfb8", w: 28, h: 28 });
  }

  fantasmas(juego, clones = false) {
    for (let i = 0; i < (clones ? 4 : 2); i++) juego.nivel.enemigos.push(juego.crearEnemigo("clon", this.x - 110 - i * 60, this.y + rand(-80, 80)));
  }

  tentaculo(juego, fase) {
    if (fase === 1) this.abanico(juego, 5, 260, "#8f4b79");
    if (fase === 2) this.dirigidos(juego, 5, "#8f4b79");
    if (fase === 3) this.lluvia(juego, 9);
    if (fase === 4) this.teledirigidas(juego, 4, "#241914");
  }

  punos(juego) {
    for (const y of [170, 540]) juego.balas.crear("enemigo", this.x - 80, y, -390, 0, { color: "#6d6a65", w: 56, h: 42 });
  }

  caos(juego, cantidad) {
    this.espiral(juego, cantidad, "#e35331");
    this.teledirigidas(juego, Math.ceil(cantidad / 8), "#8f8a74");
    if (cantidad > 20) this.punos(juego);
  }

  dibujar(g, t) {
    if (!this.activo) return;
    g.save();
    g.translate(this.x, this.y);
    const pulso = this.transicion > 0 ? 1 + Math.sin(t * 28) * 0.18 : 1 + Math.sin(t * 7) * 0.035;
    g.rotate(Math.sin(t * 4) * 0.05);
    g.scale(pulso, 1 / pulso);
    g.drawImage(sprites.jefes[this.tipo], -120, -95, 240, 190);
    if (this.transicion > 0) {
      g.strokeStyle = "#ffef9b";
      g.lineWidth = 8;
      g.beginPath();
      g.arc(0, 0, 104 + Math.sin(t * 18) * 8, 0, TAU);
      g.stroke();
    }
    g.restore();
  }
}
