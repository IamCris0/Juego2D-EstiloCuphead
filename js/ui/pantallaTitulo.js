import { ANCHO, ALTO, TAU, texto } from "../util.js";
import { sprites } from "../../sprites/sprites.js";
import { PERSONAJES } from "../jugador.js";

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
  texto(g, "ELIGE TU HEROE", ANCHO / 2, 72, 54);
  const ids = ["tacita", "platon", "tetito", "jarron", "termo", "taza_chica"];
  ids.forEach((id, i) => {
    const col = i % 3;
    const fila = Math.floor(i / 3);
    const x = ANCHO / 2 - 330 + col * 330;
    const yBase = 220 + fila * 190;
    const activo = juego.selector === i;
    const p = PERSONAJES[id];
    g.save();
    g.translate(x, yBase + Math.sin(juego.t * 4 + i) * 8);
    g.globalAlpha = activo ? 1 : 0.65;
    if (activo) {
      g.fillStyle = "rgba(255,239,155,0.18)";
      g.strokeStyle = "#ffef9b";
      g.lineWidth = 4;
      g.beginPath();
      g.roundRect(-78, -91, 156, 214, 8);
      g.fill();
      g.stroke();
    }
    g.drawImage(sprites.jugador[id].idle[Math.floor(juego.t * 7) % 3], -52, -68, 104, 118);
    g.restore();
    texto(g, p.nombre, x, yBase + 70, 25, "center", activo ? "#ffef9b" : "#f1dfb8");
    texto(g, p.descripcion, x, yBase + 98, 17);
    texto(g, `HP ${p.hp}  SALTOS ${p.saltos}  DANO ${p.dano}`, x, yBase + 122, 15, "center", activo ? "#f4e3bd" : "#9b8a6c");
  });
  const elegido = PERSONAJES[ids[juego.selector]];
  g.fillStyle = "rgba(29,18,13,0.78)";
  g.strokeStyle = "#1a100c";
  g.lineWidth = 5;
  g.beginPath();
  g.roundRect(260, 600, ANCHO - 520, 76, 8);
  g.fill();
  g.stroke();
  texto(g, `${elegido.arma}: ${elegido.especialTexto}`, ANCHO / 2, 626, 22, "center", "#ffef9b");
  texto(g, "FLECHAS: CAMBIAR    ENTER: CONFIRMAR", ANCHO / 2, 656, 20);
}
