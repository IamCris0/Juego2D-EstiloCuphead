export class Cinematica {
  constructor(escenas) {
    this.escenas = escenas;
    this.indice = 0;
    this.tiempo = 0;
    this.terminada = false;
  }

  actualizar(dt) {
    if (this.terminada) return;
    const escena = this.escenas[this.indice];
    this.tiempo += dt;
    if (this.tiempo >= escena.duracion) {
      this.indice++;
      this.tiempo = 0;
      if (this.indice >= this.escenas.length) this.terminada = true;
    }
  }

  dibujar(g) {
    if (this.terminada) return;
    const escena = this.escenas[this.indice];
    escena.dibujar(g, this.tiempo, Math.min(1, this.tiempo / escena.duracion));
  }

  saltar() {
    this.terminada = true;
  }
}
