import { ANCHO, texto } from "../util.js";
import { fondoMenu } from "./pantallaTitulo.js";

export function dibujarResultados(g, juego) {
  const r = juego.resultado;
  fondoMenu(g, juego.t);
  const cx = ANCHO / 2;
  texto(g, juego.victoriaFinal ? "VICTORIA FINAL" : "VICTORIA", cx, 115, 68, "center", "#f5d66c");
  if (juego.victoriaFinal) texto(g, "La porcelana vuelve a cantar.", cx, 190, 26);
  texto(g, `GRADO ${r.grado}`, cx, 270, 86, "center", r.grado === "S" ? "#ffef9b" : "#f1dfb8");
  texto(g, `TIEMPO ${r.tiempo.toFixed(1)}s`, cx, 380, 30);
  texto(g, `GOLPES ${r.golpes}    PARRIES ${r.parries}`, cx, 435, 30);
  texto(g, `PRECISION ${Math.round(r.precision * 100)}%    PUNTOS ${juego.puntos}`, cx, 490, 30);
  texto(g, "ENTER: VOLVER AL MAPA", cx, 625, 25);
}

export function dibujarDerrota(g, juego) {
  fondoMenu(g, juego.t);
  const cx = ANCHO / 2;
  texto(g, "NOQUEADO", cx, 230, 76, "center", "#c74334");
  texto(g, "No te rindas, camarada.", cx, 330, 42);
  texto(g, `PUNTOS ${juego.puntos}`, cx, 430, 30, "center", "#f5d66c");
  texto(g, "ENTER: MAPA DEL MUNDO", cx, 610, 26);
}
