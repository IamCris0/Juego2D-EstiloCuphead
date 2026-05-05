import { texto, tinta } from "../util.js";
import { fondoMenu } from "./pantallaTitulo.js";

export function dibujarIngresoNombre(g, juego) {
  fondoMenu(g, juego.t);
  texto(g, "ENTRASTE AL TOP 10!", 480, 115, 52, "center", "#ffef9b");
  texto(g, `POSICION #${juego.posicionPendiente}`, 480, 170, 30);
  texto(g, "INGRESA TU NOMBRE", 480, 265, 44);
  const cursor = Math.sin(juego.t * 8) > 0 ? "_" : " ";
  tinta(g, "rgba(29,18,13,0.78)", "#1a100c", 5);
  g.beginPath();
  g.roundRect(250, 330, 460, 78, 8);
  g.fill();
  g.stroke();
  texto(g, `${juego.nombreEntrada}${cursor}`, 480, 370, 44, "center", "#f4e3bd");
  texto(g, `LETRA ${juego.letraActual}`, 480, 470, 34, "center", "#d8a342");
  texto(g, "IZQ/DER: CAMBIAR LETRA    ENTER: ACEPTAR LETRA", 480, 575, 22);
  texto(g, "BACKSPACE: BORRAR    ESPACIO: FINALIZAR", 480, 615, 22);
}

export function dibujarLeaderboard(g, juego) {
  fondoMenu(g, juego.t);
  texto(g, "TABLA DE CAMPEONES", 480, 72, 52, "center", "#ffef9b");
  texto(g, juego.pestanaLB === 0 ? "[ HOY ]    GLOBAL" : "HOY    [ GLOBAL ]", 480, 118, 24, "center", "#d8a342");
  texto(g, juego.lbOnline?.disponible ? "● ONLINE" : "● LOCAL", 835, 80, 18, "center", juego.lbOnline?.disponible ? "#7ac16b" : "#8e8576");
  const tabla = juego.pestanaLB === 0 ? juego.tablaHoy : juego.tablaGlobal;
  for (let i = 0; i < 10; i++) {
    const e = tabla[i];
    const y = 155 + i * 43;
    const reciente = juego.entradaLeaderboard && e && e.puntos === juego.entradaLeaderboard.puntos && e.nombre === juego.entradaLeaderboard.nombre;
    if (i === 0 && e) {
      g.save();
      g.translate(80, y);
      g.rotate(juego.t * 2);
      g.strokeStyle = "#ffef9b";
      g.lineWidth = 4;
      g.beginPath();
      g.arc(0, 0, 16, 0, Math.PI * 2);
      g.stroke();
      g.restore();
    }
    const color = reciente ? (Math.sin(juego.t * 8) > 0 ? "#ffef9b" : "#d8a342") : i === 0 ? "#f5d66c" : "#f4e3bd";
    texto(g, e ? `${String(i + 1).padStart(2, "0")}  ${e.nombre.padEnd(12, " ")}  ${String(e.puntos).padStart(6, " ")}  M${e.mundo}  ${e.grado}  ${e.fecha}` : `${String(i + 1).padStart(2, "0")}  ---`, 480, y, 22, "center", color);
  }
  if (juego.confirmarResetTabla) texto(g, "PULSA R DE NUEVO PARA BORRAR LA TABLA", 480, 625, 24, "center", "#c74334");
  else texto(g, "ENTER: MAPA    R: RESETEAR TABLA", 480, 625, 24);
}
