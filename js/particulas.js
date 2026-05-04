import { Pool } from "./pool.js";
import { TAU, clamp, rand, tinta } from "./util.js";

export class SistemaParticulas {
  constructor() {
    this.pool = new Pool(() => ({ activo: false }), 420);
  }

  estallido(x, y, color, cantidad = 12, fuerza = 180, piezas = false) {
    for (let i = 0; i < cantidad; i++) {
      const p = this.pool.obtener();
      const a = rand(0, TAU);
      const s = rand(fuerza * 0.25, fuerza);
      Object.assign(p, {
        activo: true, x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
        vida: rand(0.25, piezas ? 1.1 : 0.65), max: piezas ? 1.1 : 0.65,
        r: rand(2, piezas ? 12 : 8), color, gravedad: rand(120, 420),
        rot: rand(0, TAU), vr: rand(-8, 8), pieza: piezas
      });
    }
  }

  actualizar(dt) {
    this.pool.cada(p => {
      p.vida -= dt;
      if (p.vida <= 0) p.activo = false;
      p.vy += p.gravedad * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
    });
  }

  dibujar(g) {
    this.pool.cada(p => {
      g.save();
      g.globalAlpha = clamp(p.vida / p.max, 0, 1);
      g.translate(p.x, p.y);
      g.rotate(p.rot);
      tinta(g, p.color, "#1a100c", 2);
      if (p.pieza) g.roundRect(-p.r, -p.r * 0.65, p.r * 2, p.r * 1.3, 3);
      else g.arc(0, 0, p.r, 0, TAU);
      g.fill();
      g.stroke();
      g.restore();
    });
  }

  limpiar() {
    this.pool.limpiar();
  }
}
