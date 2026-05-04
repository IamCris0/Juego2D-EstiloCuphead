export class Pool {
  constructor(fabrica, tamano) {
    this.items = Array.from({ length: tamano }, fabrica);
  }

  obtener() {
    return this.items.find(item => !item.activo) || this.items[0];
  }

  cada(fn) {
    for (const item of this.items) if (item.activo) fn(item);
  }

  limpiar() {
    for (const item of this.items) item.activo = false;
  }
}
