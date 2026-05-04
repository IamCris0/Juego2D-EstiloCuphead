import { ANCHO, ALTO, TAU, texto } from "../util.js";
import { sprites } from "../../sprites/sprites.js";

export function fondoMenu(g, t) {
  const grad = g.createLinearGradient(0, 0, 0, ALTO);
  grad.addColorStop(0, "#6f563d");
  grad.addColorStop(1, "#211611");
  g.fillStyle = grad;
  g.fillRect(0, 0, ANCHO, ALTO);
  g.save();
  g.globalAlpha = 0.3;
  for (let i = 0; i < 14; i++) {
    const x = (i * 100 + t * (18 + i)) % (ANCHO + 160) - 80;
    g.fillStyle = i % 2 ? "#f1dfb8" : "#1a100c";
    g.beginPath();
    g.arc(x, 95 + Math.sin(t + i) * 34, 28 + i % 3 * 9, 0, TAU);
    g.fill();
  }
  g.restore();
}

export function dibujarTitulo(g, juego) {
  fondoMenu(g, juego.t);
  texto(g, "PANICO DE PORCELANA", ANCHO / 2, 175 + Math.sin(juego.t * 3) * 8, 64);
  texto(g, "UNA AVENTURA DE TINTA Y JAZZ", ANCHO / 2, 246, 25, "center", "#d8a342");
  g.save();
  g.translate(ANCHO / 2, 410);
  g.scale(1.8, 1.8);
  const lista = sprites.jugador[juego.guardado.personaje].idle;
  g.drawImage(lista[Math.floor(juego.t * 8) % lista.length], -43, -56);
  g.restore();
  texto(g, "ENTER: EMPEZAR    P: PERSONAJE    S: CONFIGURACION", ANCHO / 2, 590, 22);
  texto(g, `RECORD ${juego.guardado.record}`, ANCHO / 2, 640, 22, "center", "#f5d66c");
}

export function dibujarSeleccion(g, juego) {
  fondoMenu(g, juego.t);
  texto(g, "ELIGE TU HEROE", 480, 90, 56);
  const ids = ["tacita", "platon", "tetito"];
  ids.forEach((id, i) => {
    const x = 240 + i * 240;
    const activo = juego.selector === i;
    g.save();
    g.translate(x, 300 + Math.sin(juego.t * 4 + i) * 8);
    g.globalAlpha = activo ? 1 : 0.65;
    g.drawImage(sprites.jugador[id].idle[Math.floor(juego.t * 7) % 3], -65, -85, 130, 148);
    g.restore();
    texto(g, ["TACITA", "PLATON", "TETITO"][i], x, 445, 32, "center", activo ? "#ffef9b" : "#f1dfb8");
    texto(g, ["Balanceada", "+1 vida, dash largo", "Triple salto, agil"][i], x, 485, 19);
  });
  texto(g, "FLECHAS: CAMBIAR    ENTER: CONFIRMAR", 480, 640, 24);
}
