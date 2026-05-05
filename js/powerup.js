import { aabb, TAU } from "./util.js";

export const TIPOS_POWERUP = {
  vida: { color: "#c74334", icono: "+", duracion: 0, efecto: "instant" },
  super_max: { color: "#4aa39a", icono: "*", duracion: 0, efecto: "instant" },
  velocidad: { color: "#f0c85a", icono: "V", duracion: 8, efecto: "temporal" },
  invencible: { color: "#ff8abf", icono: "I", duracion: 5, efecto: "temporal" },
  doble_bala: { color: "#f5d66c", icono: "D", duracion: 10, efecto: "temporal" },
  escudo: { color: "#7ac16b", icono: "O", duracion: 0, efecto: "instant" }
};

export class SistemaPowerups {
  constructor() {
    this.items = [];
  }

  crear(x, y, tipo) {
    this.items.push({ x, y, tipo, tomado: false, t: 0, w: 28, h: 28 });
  }

  actualizar(dt, juego) {
    for (const p of this.items) {
      if (p.tomado) continue;
      p.t += dt;
      const r = juego.jugador.rect();
      const pr = { x: p.x - 14, y: p.y - 14, w: 28, h: 28 };
      if (aabb(r, pr)) {
        p.tomado = true;
        this.aplicar(p.tipo, juego);
        juego.particulas.estallido(p.x, p.y, TIPOS_POWERUP[p.tipo].color, 18, 240);
        juego.audio.sfx("moneda");
        juego.notificaciones.push({ texto: `POWER: ${p.tipo.toUpperCase()}`, vida: 2.5 });
        juego.statsActualizar?.("powerupsRecogidos", 1);
      }
    }
  }

  aplicar(tipo, juego) {
    const p = TIPOS_POWERUP[tipo];
    const j = juego.jugador;
    if (tipo === "vida") j.hp = Math.min(j.maxHp, j.hp + 1);
    if (tipo === "super_max") j.super = 100;
    if (tipo === "escudo") j.escudos = Math.min(j.escudos + 1, 3);
    if (p.efecto === "temporal") {
      juego.powerupsActivos = juego.powerupsActivos || {};
      juego.powerupsActivos[tipo] = p.duracion;
    }
  }

  dibujar(g, t) {
    g.save();
    g.setLineDash([]);
    g.lineDashOffset = 0;
    g.beginPath();
    for (const p of this.items) {
      if (p.tomado) continue;
      g.save();
      g.setLineDash([]);
      g.lineDashOffset = 0;
      g.beginPath();
      g.translate(p.x, p.y + Math.sin(p.t * 4) * 6);
      const pulso = 1 + Math.sin(p.t * 8) * 0.1;
      g.fillStyle = TIPOS_POWERUP[p.tipo].color;
      g.strokeStyle = "#1a100c";
      g.lineWidth = 3;
      g.beginPath();
      g.arc(0, 0, 16 * pulso, 0, TAU);
      g.fill();
      g.stroke();
      g.fillStyle = "#1a100c";
      g.font = "bold 14px Georgia";
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText(TIPOS_POWERUP[p.tipo].icono, 0, 0);
      g.restore();
    }
    g.restore();
  }

  limpiar() {
    this.items = [];
  }
}
