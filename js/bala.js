import { Pool } from "./pool.js";
import { TAU, aabb, lerp, tinta } from "./util.js";

export class SistemaBalas {
  constructor() {
    this.pool = new Pool(() => ({ activo: false }), 520);
  }

  crear(dueno, x, y, vx, vy, opts = {}) {
    const b = this.pool.obtener();
    Object.assign(b, {
      activo: true, dueno, x, y, vx, vy,
      w: opts.w || 12, h: opts.h || 12,
      dano: opts.dano || 1, rosa: !!opts.rosa, teledirigida: opts.teledirigida || 0,
      vida: opts.vida || 3, color: opts.color || (dueno === "jugador" ? "#f4e189" : "#d24a43"),
      giro: 0, tipo: opts.tipo || "bala", rebotes: opts.rebotes || 0
    });
    return b;
  }

  actualizar(dt, juego) {
    this.pool.cada(b => {
      b.vida -= dt;
      if (b.vida <= 0) b.activo = false;
      if (b.teledirigida && b.dueno !== "jugador") {
        const p = juego.jugador;
        const a = Math.atan2(p.y - b.y, p.x - b.x);
        b.vx = lerp(b.vx, Math.cos(a) * 265, b.teledirigida * dt);
        b.vy = lerp(b.vy, Math.sin(a) * 265, b.teledirigida * dt);
      }
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.giro += dt * 8;
      if (b.dueno === "jugador" && b.rebotes > 0 && (b.y < 40 || b.y > 680)) {
        b.vy *= -1;
        b.y = Math.max(40, Math.min(680, b.y));
        b.rebotes--;
      }
      if (b.x < juego.camara.x - 150 || b.x > juego.camara.x + 1120 || b.y < -160 || b.y > 880) b.activo = false;
      const br = { x: b.x - b.w / 2, y: b.y - b.h / 2, w: b.w, h: b.h };
      if (b.dueno === "jugador") {
        for (const e of juego.nivel.enemigos) {
          if (e.activo && aabb(br, e.rect())) {
            e.recibir(b.dano, juego);
            b.activo = false;
            juego.jugador.aciertos++;
            juego.jugador.super = Math.min(100, juego.jugador.super + 1.7 + (juego.guardado.mejoraSuper || 0));
            break;
          }
        }
        const jefe = juego.nivel.jefe;
        if (b.activo && jefe?.activo && aabb(br, jefe.rect())) {
          jefe.recibir(b.dano, juego);
          b.activo = false;
          juego.jugador.aciertos++;
        }
      } else if (aabb(br, juego.jugador.rect())) {
        const parryAuto = b.rosa && (juego.guardado.mejoras.parryAuto || 0) > 0 && Math.hypot(b.x - juego.jugador.x, b.y - juego.jugador.y) < 52;
        if (b.rosa && (parryAuto || juego.input.disparoMantenido()) && (juego.jugador.vy > 0 || juego.jugador.aereo || parryAuto)) {
          b.activo = false;
          juego.jugador.parry(juego);
        } else {
          b.activo = false;
          juego.jugador.herir(juego);
        }
      }
    });
  }

  dibujar(g) {
    g.save();
    g.setLineDash([]);
    g.lineDashOffset = 0;
    this.pool.cada(b => {
      g.save();
      g.translate(b.x, b.y);
      g.rotate(Math.atan2(b.vy, b.vx) + Math.sin(b.giro) * 0.2);
      tinta(g, b.color, "#1a100c", 3);
      if (b.tipo === "rayo") g.roundRect(-b.w / 2, -b.h / 2, b.w, b.h, 3);
      else g.ellipse(0, 0, b.w / 2, b.h / 2, 0, 0, TAU);
      g.fill();
      g.stroke();
      if (b.rosa) {
        g.strokeStyle = "#fff0cf";
        g.lineWidth = 2;
        g.beginPath();
        g.arc(0, 0, b.w * 0.52, 0, TAU);
        g.stroke();
      }
      g.restore();
    });
    g.restore();
  }

  limpiar() {
    this.pool.limpiar();
  }
}
