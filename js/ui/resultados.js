import { texto } from "../util.js";
import { fondoMenu } from "./pantallaTitulo.js";

export function dibujarResultados(g, juego) {
  const r = juego.resultado;
  fondoMenu(g, juego.t);
  texto(g, juego.victoriaFinal ? "VICTORIA FINAL" : "VICTORIA", 480, 115, 68, "center", "#f5d66c");
  if (juego.victoriaFinal) texto(g, "La porcelana vuelve a cantar.", 480, 190, 26);
  texto(g, `GRADO ${r.grado}`, 480, 270, 86, "center", r.grado === "S" ? "#ffef9b" : "#f1dfb8");
  texto(g, `TIEMPO ${r.tiempo.toFixed(1)}s`, 480, 380, 30);
  texto(g, `GOLPES ${r.golpes}    PARRIES ${r.parries}`, 480, 435, 30);
  texto(g, `PRECISION ${Math.round(r.precision * 100)}%    PUNTOS ${juego.puntos}`, 480, 490, 30);
  texto(g, "ENTER: VOLVER AL MAPA", 480, 625, 25);
}

export function dibujarDerrota(g, juego) {
  fondoMenu(g, juego.t);
  texto(g, "NOQUEADO", 480, 230, 76, "center", "#c74334");
  texto(g, "No te rindas, camarada.", 480, 330, 42);
  texto(g, `PUNTOS ${juego.puntos}`, 480, 430, 30, "center", "#f5d66c");
  texto(g, "ENTER: MAPA DEL MUNDO", 480, 610, 26);
}
