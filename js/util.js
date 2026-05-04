export const ANCHO = 960;
export const ALTO = 720;
export const TAU = Math.PI * 2;

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const rand = (a, b) => a + Math.random() * (b - a);
export const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

export function aabb(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function tinta(g, relleno = "#f5dfbd", borde = "#1a100c", ancho = 4) {
  g.fillStyle = relleno;
  g.strokeStyle = borde;
  g.lineWidth = ancho;
  g.lineCap = "round";
  g.lineJoin = "round";
}

export function texto(g, s, x, y, tam = 32, alinear = "center", color = "#f4e3bd") {
  g.save();
  g.font = `900 ${tam}px Georgia, serif`;
  g.textAlign = alinear;
  g.textBaseline = "middle";
  g.lineWidth = Math.max(3, tam * 0.14);
  g.strokeStyle = "#1a100c";
  g.fillStyle = color;
  g.strokeText(s, x, y);
  g.fillText(s, x, y);
  g.restore();
}

export function medidor(g, x, y, w, h, v, color, etiqueta = "") {
  tinta(g, "#3b2921", "#1a100c", 3);
  g.beginPath();
  g.roundRect(x, y, w, h, 6);
  g.fill();
  g.stroke();
  g.fillStyle = color;
  g.fillRect(x + 3, y + 3, (w - 6) * clamp(v, 0, 1), h - 6);
  if (etiqueta) texto(g, etiqueta, x + w / 2, y + h - 3, 12);
}

if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function roundRect(x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    this.beginPath();
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    this.closePath();
    return this;
  };
}
