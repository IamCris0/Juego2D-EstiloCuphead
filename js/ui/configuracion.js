import { ANCHO, medidor, texto } from "../util.js";
import { fondoMenu } from "./pantallaTitulo.js";
import { audio } from "../audio.js";

export function dibujarConfiguracion(g, juego) {
  fondoMenu(g, juego.t);
  const cx = ANCHO / 2;
  texto(g, "CONFIGURACION", cx, 130, 58);
  texto(g, `VOLUMEN ${Math.round(audio.volumen * 100)}%`, cx, 280, 36);
  medidor(g, cx - 170, 325, 340, 24, audio.volumen, "#d8a342");
  texto(g, `SILENCIO ${audio.silencio ? "ACTIVADO" : "DESACTIVADO"}  (M)`, cx, 395, 30);
  texto(g, "MOVER: WASD/FLECHAS   SALTAR: Z/ESPACIO   DISPARAR: X", cx, 500, 21);
  texto(g, "DASH: C   SUPER: V   PAUSA: ENTER   GAMEPAD: COMPATIBLE", cx, 540, 21);
  texto(g, "IZQ/DER: VOLUMEN    ENTER/ESC: VOLVER", cx, 635, 24);
}
