import { ANCHO, texto, tinta } from "../util.js";
import { fondoMenu } from "./pantallaTitulo.js";

export function dibujarIngresoNombre(g, juego) {
  fondoMenu(g, juego.t);
  const cx = ANCHO / 2;
  texto(g, "ENTRASTE AL TOP 10!", cx, 115, 52, "center", "#ffef9b");
  texto(g, `POSICION #${juego.posicionPendiente}`, cx, 170, 30);
  texto(g, "INGRESA TU NOMBRE", cx, 265, 44);
  const cursor = Math.sin(juego.t * 8) > 0 ? "_" : " ";
  tinta(g, "rgba(29,18,13,0.78)", "#1a100c", 5);
  g.beginPath();
  g.roundRect(cx - 230, 330, 460, 78, 8);
  g.fill();
  g.stroke();
  texto(g, `${juego.nombreEntrada}${cursor}`, cx, 370, 44, "center", "#f4e3bd");
  texto(g, `LETRA ${juego.letraActual}`, cx, 470, 34, "center", "#d8a342");
  texto(g, "IZQ/DER: CAMBIAR LETRA    ENTER: ACEPTAR LETRA", cx, 575, 22);
  texto(g, "BACKSPACE: BORRAR    ESPACIO: FINALIZAR", cx, 615, 22);
}

export function dibujarLeaderboard(g, juego) {
  fondoMenu(g, juego.t);
  const cx = ANCHO / 2;
  texto(g, "TABLA DE CAMPEONES", cx, 72, 52, "center", "#ffef9b");
  const tabs = ["HOY", "GLOBAL", "STATS"].map((t, i) => juego.pestanaLB === i ? `[ ${t} ]` : t).join("    ");
  texto(g, tabs, cx, 118, 24, "center", "#d8a342");
  texto(g, juego.lbOnline?.disponible ? "ONLINE" : "LOCAL", ANCHO - 120, 80, 18, "center", juego.lbOnline?.disponible ? "#7ac16b" : "#8e8576");
  if (juego.pestanaLB === 2) {
    dibujarStats(g, juego);
    texto(g, "ENTER: MAPA    IZQ/DER: PESTANAS", cx, 625, 24);
    return;
  }
  const tabla = juego.pestanaLB === 0 ? juego.tablaHoy : juego.tablaGlobal;
  for (let i = 0; i < 10; i++) {
    const e = tabla[i];
    const y = 155 + i * 43;
    const reciente = juego.entradaLeaderboard && e && e.puntos === juego.entradaLeaderboard.puntos && e.nombre === juego.entradaLeaderboard.nombre;
    if (i === 0 && e) {
      g.save();
      g.translate(cx - 430, y);
      g.rotate(juego.t * 2);
      g.strokeStyle = "#ffef9b";
      g.lineWidth = 4;
      g.beginPath();
      g.arc(0, 0, 16, 0, Math.PI * 2);
      g.stroke();
      g.restore();
    }
    const color = reciente ? (Math.sin(juego.t * 8) > 0 ? "#ffef9b" : "#d8a342") : i === 0 ? "#f5d66c" : "#f4e3bd";
    const fila = e ? `${String(i + 1).padStart(2, "0")}  ${e.nombre.padEnd(12, " ")}  ${String(e.puntos).padStart(6, " ")}  M${e.mundo}  ${e.grado}  ${e.fecha}` : `${String(i + 1).padStart(2, "0")}  ---`;
    texto(g, fila, cx, y, 22, "center", color);
  }
  if (juego.confirmarResetTabla) texto(g, "PULSA R DE NUEVO PARA BORRAR LA TABLA", cx, 625, 24, "center", "#c74334");
  else texto(g, "ENTER: MAPA    R: RESETEAR TABLA", cx, 625, 24);
}

function dibujarStats(g, juego) {
  const datos = [
    ["Disparos", juego.stats.totalDisparos],
    ["Bajas", juego.stats.totalKills],
    ["Muertes", juego.stats.totalMuertes],
    ["Parries", juego.stats.totalParries],
    ["Tiempo", Math.floor(juego.stats.tiempoTotal)],
    ["Mejor combo", juego.stats.mejorCombo.toFixed(1)],
    ["Powerups", juego.stats.powerupsRecogidos]
  ];
  const x = ANCHO / 2 - 270;
  datos.forEach((d, i) => {
    const y = 180 + i * 52;
    texto(g, d[0], x, y, 23, "left", "#f4e3bd");
    g.fillStyle = "#3b2921";
    g.fillRect(x + 170, y - 10, 300, 18);
    g.fillStyle = "#d8a342";
    g.fillRect(x + 170, y - 10, Math.min(300, Number(d[1]) * 3), 18);
    texto(g, `${d[1]}`, x + 500, y, 22, "left", "#ffef9b");
  });
}
