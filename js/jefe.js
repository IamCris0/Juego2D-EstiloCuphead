import { registrarPosicionJefe, tacticaRepetida } from "./ia.js";
import { ANCHO, TAU, aabb, rand } from "./util.js";
import { sprites } from "../sprites/sprites.js";

const JEFES = {
  arbol: { nombre: "ARBOL MALVADO", hp: 720, fases: 3, dialogo: ["Bellotas en abanico", "Raices bajo tus pies", "Hojas lentas y bellotas"] },
  nube: { nombre: "NUBE TORMENTOSA", hp: 820, fases: 4, dialogo: ["Rayos dirigidos", "Granizo espaciado", "Tornados laterales", "Viento al centro"] },
  joker: { nombre: "EL GRAN JOKER", hp: 780, fases: 3, dialogo: ["Cartas en abanico", "Dados rebotones", "Copias y naipes"] },
  pulpo: { nombre: "PULPO PIRATA", hp: 960, fases: 5, dialogo: ["Tentaculo uno", "Tentaculo dos", "Tentaculo tres", "Tentaculo cuatro", "Tinta total"] },
  diablo: { nombre: "DIABLO DE PORCELANA", hp: 1280, fases: 6, dialogo: ["Punos mecanicos", "Engranajes vivos", "Fuego en espiral", "Copias rotas", "Todo al reves", "Forma final"] },
  cocodrilo: { nombre: "COCODRILO GIGANTE", hp: 210, fases: 2, dialogo: ["Chasquido", "Cola salvaje"] }
};

const COLOR_JEFE = {
  arbol: "#7d593c", nube: "#5f6477", joker: "#b94355",
  pulpo: "#8f4b79", diablo: "#9b2f24", cocodrilo: "#557a45"
};

export class Jefe {
  constructor(tipo, x, y) {
    const datos = JEFES[tipo];
    Object.assign(this, {
      tipo,
      nombre: datos.nombre,
      x,
      y,
      baseX: x,
      baseY: y,
      w: tipo === "diablo" ? 210 : 168,
      h: tipo === "diablo" ? 168 : 134,
      hp: datos.hp,
      maxHp: datos.hp,
      fasesMax: datos.fases,
      fase: 1,
      activo: true,
      t: 0,
      cooldown: 1.35,
      transicion: 0,
      aviso: 0,
      memoria: [],
      emocion: "burlon",
      dialogo: datos.dialogo[0],
      final: tipo === "diablo"
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
      this.aviso = 0.75;
      this.cooldown = 1.05;
      this.emocion = nueva >= this.fasesMax ? "desesperado" : "enojado";
      this.dialogo = JEFES[this.tipo].dialogo[nueva - 1];
      juego.camara.golpear(24);
      juego.audio.sfx("fase");
    }
  }

  actualizar(dt, juego) {
    if (!this.activo) return;
    this.t += dt;
    this.transicion = Math.max(0, this.transicion - dt);
    this.aviso = Math.max(0, this.aviso - dt);
    registrarPosicionJefe(this, juego.jugador);
    const repetido = tacticaRepetida(this);
    this.x = this.baseX + Math.sin(this.t * (0.9 + this.fase * 0.16)) * (this.tipo === "diablo" ? 40 : 24);
    this.y = this.baseY + Math.sin(this.t * 1.35) * (this.tipo === "pulpo" ? 42 : 56);
    this.cooldown -= dt;
    if (this.cooldown <= 0 && this.aviso <= 0) {
      this.aviso = 0.42;
      this.cooldown = 0.42;
      juego.particulas.estallido(this.x - 45, this.y, "#ffef9b", 5, 90);
    } else if (this.cooldown <= 0 && this.aviso > 0) {
      this.atacar(juego, repetido);
    }
    if (aabb(this.rect(), juego.jugador.rect())) juego.jugador.herir(juego);
  }

  aplicarReintento(juego) {
    const n = juego.reintentos?.[juego.mundo] || 0;
    const mult = n <= 0 ? 1 : n === 1 ? 1.04 : 1.08;
    this.hp *= mult;
    this.maxHp = this.hp;
  }

  atacar(juego, castigo) {
    const f = this.fase;
    if (this.tipo === "arbol") {
      if (f === 1) this.abanico(juego, 5, 240, "#7d593c");
      else if (f === 2) this.raices(juego);
      else { this.espiral(juego, 12, "#6c9b4a"); this.teledirigidas(juego, 2, "#7d593c"); }
    } else if (this.tipo === "nube") {
      if (f === 1) this.dirigidos(juego, 2, "#f6e27a", "rayo");
      else if (f === 2) this.lluvia(juego, 8);
      else if (f === 3) this.tornados(juego);
      else { this.absorber(juego); this.espiral(juego, 10, "#7e86a3"); }
    } else if (this.tipo === "joker") {
      if (f === 1) this.abanico(juego, 7, 250, "#f1dfb8", true);
      else if (f === 2) this.dados(juego);
      else { this.teledirigidas(juego, castigo ? 5 : 3, "#f1dfb8"); this.fantasmas(juego); }
    } else if (this.tipo === "pulpo") {
      if (f < 5) this.tentaculo(juego, f);
      else { this.espiral(juego, 14, "#241914"); juego.oscuridad = 0.55; }
    } else if (this.tipo === "diablo") {
      if (f === 1) this.punos(juego);
      else if (f === 2) this.espiral(juego, 8, "#8f8a74");
      else if (f === 3) this.espiral(juego, 14, "#e35331");
      else if (f === 4) this.fantasmas(juego, true);
      else if (f === 5) { juego.invertido = 1.2; this.caos(juego, 10); }
      else this.caos(juego, 18);
    } else {
      if (f === 1) this.dirigidos(juego, 3, "#cf3f38");
      else this.abanico(juego, 6, 280, "#557a45");
    }
    this.aviso = 0;
    this.cooldown = Math.max(0.78, 1.55 - this.fase * 0.08);
  }

  abanico(juego, cantidad, vel, color, rosa = false) {
    for (let i = 0; i < cantidad; i++) {
      const a = Math.PI + (i - (cantidad - 1) / 2) * 0.18;
      juego.balas.crear("enemigo", this.x - 70, this.y, Math.cos(a) * vel, Math.sin(a) * vel, { color, rosa: rosa && i % 3 === 0, vida: 4.2 });
    }
  }

  espiral(juego, cantidad, color) {
    for (let i = 0; i < cantidad; i++) {
      const a = this.t * 2.5 + i / cantidad * TAU;
      juego.balas.crear("enemigo", this.x, this.y, Math.cos(a) * 185, Math.sin(a) * 185, { color, rosa: i % 6 === 0, vida: 4.6 });
    }
  }

  dirigidos(juego, cantidad, color, tipo = "bala") {
    const p = juego.jugador;
    const base = Math.atan2(p.y - this.y, p.x - this.x);
    for (let i = 0; i < cantidad; i++) {
      const a = base + (i - (cantidad - 1) / 2) * 0.14;
      juego.balas.crear("enemigo", this.x - 50, this.y, Math.cos(a) * 300, Math.sin(a) * 300, { color, tipo, w: tipo === "rayo" ? 26 : 12, h: tipo === "rayo" ? 8 : 12 });
    }
  }

  teledirigidas(juego, cantidad, color) {
    for (let i = 0; i < cantidad; i++) {
      const a = rand(Math.PI * 0.7, Math.PI * 1.3);
      juego.balas.crear("enemigo", this.x + rand(-45, 45), this.y + rand(-35, 35), Math.cos(a) * 140, Math.sin(a) * 140, { color, teledirigida: 0.85, vida: 3.6 });
    }
  }

  raices(juego) {
    for (let i = 0; i < 4; i++) juego.balas.crear("enemigo", juego.camara.x + 220 + i * 210, 690, 0, -300, { color: "#4f3a22", w: 28, h: 70, vida: 1.2 });
  }

  lluvia(juego, cantidad) {
    for (let i = 0; i < cantidad; i++) juego.balas.crear("enemigo", juego.camara.x + rand(80, ANCHO - 100), -20, rand(-20, 20), rand(220, 340), { color: "#d8d1bd" });
  }

  tornados(juego) {
    for (const lado of [-1, 1]) juego.balas.crear("enemigo", juego.camara.x + (lado < 0 ? -30 : ANCHO + 30), rand(160, 560), lado * -220, 0, { color: "#d8d1bd", w: 46, h: 46 });
  }

  absorber(juego) {
    const p = juego.jugador;
    p.vx += (this.x - p.x) * 0.018;
    p.vy += (this.y - p.y) * 0.018;
  }

  dados(juego) {
    for (let i = 0; i < 2; i++) juego.balas.crear("enemigo", this.x, this.y + i * 28 - 14, -260, rand(-130, 130), { color: "#f1dfb8", w: 28, h: 28 });
  }

  fantasmas(juego, clones = false) {
    const maxClones = juego.nivel.enemigos.filter(e => e.tipo === "clon" && e.activo).length;
    if (maxClones > 3) return;
    for (let i = 0; i < (clones ? 2 : 1); i++) juego.nivel.enemigos.push(juego.crearEnemigo("clon", this.x - 110 - i * 60, this.y + rand(-80, 80)));
  }

  tentaculo(juego, fase) {
    if (fase === 1) this.abanico(juego, 4, 230, "#8f4b79");
    if (fase === 2) this.dirigidos(juego, 3, "#8f4b79");
    if (fase === 3) this.lluvia(juego, 7);
    if (fase === 4) this.teledirigidas(juego, 2, "#241914");
  }

  punos(juego) {
    for (const y of [190, 530]) juego.balas.crear("enemigo", this.x - 80, y, -300, 0, { color: "#6d6a65", w: 56, h: 42 });
  }

  caos(juego, cantidad) {
    this.espiral(juego, cantidad, "#e35331");
    this.teledirigidas(juego, Math.ceil(cantidad / 9), "#8f8a74");
    if (cantidad > 14) this.punos(juego);
  }

  dibujar(g, t) {
    if (!this.activo) return;
    g.save();
    g.setLineDash([]);
    g.lineDashOffset = 0;
    g.beginPath();
    g.translate(this.x, this.y);
    const pulso = this.transicion > 0 ? 1 + Math.sin(t * 28) * 0.18 : 1 + Math.sin(t * 7) * 0.035;
    g.rotate(Math.sin(t * 4) * 0.05);
    g.scale(pulso, 1 / pulso);
    const img = sprites.jefes?.[this.tipo];
    if (img) this.dibujarConDetalles(g, img, t);
    else this.dibujarFallback(g);
    if (this.transicion > 0) {
      g.strokeStyle = "#ffef9b";
      g.lineWidth = 8;
      g.beginPath();
      g.arc(0, 0, 104 + Math.sin(t * 18) * 8, 0, TAU);
      g.stroke();
    }
    if (this.aviso > 0) {
      g.globalAlpha = 0.65 + Math.sin(t * 32) * 0.25;
      g.strokeStyle = "#ffef9b";
      g.lineWidth = 6;
      g.beginPath();
      g.arc(-42, -8, 34 + Math.sin(t * 22) * 5, 0, TAU);
      g.stroke();
    }
    g.restore();
  }

  dibujarConDetalles(g, img, t) {
    g.drawImage(img, -120, -95, 240, 190);
    g.save();
    g.globalAlpha = 0.8;
    if (this.tipo === "arbol") {
      g.strokeStyle = "#31502e"; g.lineWidth = 5;
      for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(-70 + i * 46, 35); g.quadraticCurveTo(-90 + i * 50, 65 + Math.sin(t * 5 + i) * 8, -62 + i * 43, 82); g.stroke(); }
    } else if (this.tipo === "nube") {
      g.strokeStyle = "#ffef9b"; g.lineWidth = 4;
      for (let i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(i * 36, 45); g.lineTo(i * 36 - 16, 72); g.lineTo(i * 36 + 8, 72); g.lineTo(i * 36 - 10, 100); g.stroke(); }
    } else if (this.tipo === "joker") {
      g.fillStyle = "#f1dfb8";
      for (let i = 0; i < 5; i++) { g.save(); g.rotate((-2 + i) * 0.18); g.fillRect(-12, -112, 24, 36); g.restore(); }
    } else if (this.tipo === "pulpo") {
      g.strokeStyle = "#5f2f58"; g.lineWidth = 10;
      for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(-60 + i * 30, 60); g.quadraticCurveTo(-100 + i * 52, 110 + Math.sin(t * 4 + i) * 18, -80 + i * 42, 122); g.stroke(); }
    } else if (this.tipo === "diablo") {
      g.fillStyle = "rgba(255,120,45,0.45)";
      for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(-70 + i * 35, 88); g.quadraticCurveTo(-55 + i * 35, 48 + Math.sin(t * 8 + i) * 10, -35 + i * 35, 88); g.fill(); }
    }
    g.restore();
  }

  dibujarFallback(g) {
    g.fillStyle = COLOR_JEFE[this.tipo] || "#8f5f37";
    g.strokeStyle = "#1a100c";
    g.lineWidth = 8;
    g.beginPath();
    g.ellipse(0, 0, 82, 66, 0, 0, TAU);
    g.fill();
    g.stroke();
    g.fillStyle = "#1a100c";
    g.beginPath(); g.ellipse(-25, -14, 8, 16, 0, 0, TAU); g.fill();
    g.beginPath(); g.ellipse(25, -14, 8, 16, 0, 0, TAU); g.fill();
    g.strokeStyle = "#1a100c";
    g.lineWidth = 7;
    g.beginPath();
    g.arc(0, 24, 35, 0.1, Math.PI - 0.1);
    g.stroke();
  }
}
