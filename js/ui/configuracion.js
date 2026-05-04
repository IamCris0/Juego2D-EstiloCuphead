import { medidor, texto } from "../util.js";
import { fondoMenu } from "./pantallaTitulo.js";
import { audio } from "../audio.js";

export function dibujarConfiguracion(g, juego) {
  fondoMenu(g, juego.t);
  texto(g, "CONFIGURACION", 480, 130, 58);
  texto(g, `VOLUMEN ${Math.round(audio.volumen * 100)}%`, 480, 280, 36);
  medidor(g, 310, 325, 340, 24, audio.volumen, "#d8a342");
  texto(g, `SILENCIO ${audio.silencio ? "ACTIVADO" : "DESACTIVADO"}  (M)`, 480, 395, 30);
  texto(g, "MOVER: WASD/FLECHAS   SALTAR: Z/ESPACIO   DISPARAR: X", 480, 500, 21);
  texto(g, "DASH: C   SUPER: V   PAUSA: ENTER   GAMEPAD: COMPATIBLE", 480, 540, 21);
  texto(g, "IZQ/DER: VOLUMEN    ENTER/ESC: VOLVER", 480, 635, 24);
}
