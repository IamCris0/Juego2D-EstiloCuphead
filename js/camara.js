import { ANCHO, ALTO, clamp, rand } from "./util.js";

export class Camara {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.sacudida = 0;
    this.zoom = 1;
    this.zoomObj = 1;
    this.lensFlare = 0;
  }

  seguir(objetivo, anchoNivel) {
    this.x = clamp(objetivo.x - ANCHO * 0.36, 0, Math.max(0, anchoNivel - ANCHO));
    this.y = 0;
  }

  golpear(intensidad) {
    this.sacudida = Math.max(this.sacudida, intensidad);
  }

  superDestello() {
    this.lensFlare = 0.7;
    this.golpear(24);
  }

  muerteJefe() {
    this.zoomObj = 0.88;
    this.golpear(34);
  }

  actualizar(dt) {
    this.sacudida = Math.max(0, this.sacudida - 52 * dt);
    this.zoom += (this.zoomObj - this.zoom) * 0.04;
    this.zoomObj += (1 - this.zoomObj) * 0.02;
    this.lensFlare = Math.max(0, this.lensFlare - dt);
  }

  aplicar(g) {
    const sx = this.sacudida > 0 ? rand(-this.sacudida, this.sacudida) : 0;
    const sy = this.sacudida > 0 ? rand(-this.sacudida, this.sacudida) : 0;
    g.translate(Math.round(-this.x + sx), Math.round(-this.y + sy));
  }
}
