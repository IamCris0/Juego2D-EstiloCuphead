import { ANCHO, medidor, texto } from "../util.js";

export function dibujarHud(g, juego) {
  g.save();
  g.fillStyle = "rgba(29, 18, 13, 0.72)";
  g.fillRect(0, 0, ANCHO, 58);
  for (let i = 0; i < juego.jugador.maxHp; i++) {
    g.fillStyle = i < juego.jugador.hp ? "#c74334" : "#4a332a";
    g.strokeStyle = "#1a100c";
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(30 + i * 30, 20);
    g.bezierCurveTo(20 + i * 30, 8, 6 + i * 30, 24, 30 + i * 30, 42);
    g.bezierCurveTo(54 + i * 30, 24, 40 + i * 30, 8, 30 + i * 30, 20);
    g.fill();
    g.stroke();
  }
  medidor(g, 155, 18, 145, 18, juego.jugador.super / 100, "#4aa39a", "SUPER");
  let px = 155;
  for (const [tipo, tiempo] of Object.entries(juego.powerupsActivos || {})) {
    const def = juego.tiposPowerup?.[tipo] || { color: "#f1dfb8", icono: "?" };
    g.fillStyle = def.color;
    g.strokeStyle = "#1a100c";
    g.lineWidth = 2;
    g.beginPath();
    g.arc(px + 10, 49, 9, 0, Math.PI * 2);
    g.fill();
    g.stroke();
    g.fillStyle = "#1a100c";
    g.font = "bold 10px Georgia";
    g.textAlign = "center";
    g.fillText(def.icono, px + 10, 52);
    g.fillStyle = def.color;
    g.fillRect(px, 57, Math.max(0, tiempo) * 3, 3);
    px += 34;
  }
  texto(g, `PUNTOS ${juego.puntos}`, 325, 35, 21, "left");
  texto(g, `x${juego.combo.toFixed(1)}`, 495, 35, 21, "left");
  texto(g, `TIEMPO ${Math.floor(juego.tiempo)}`, 590, 35, 21, "left");
  texto(g, `MONEDAS ${juego.monedas}`, 725, 35, 21, "left");
  texto(g, `VIDAS ${Math.max(0, juego.vidas + 1)}`, 865, 35, 21, "left");
  if (juego.nivel?.jefe?.activo) {
    medidor(g, 230, 64, 500, 18, juego.nivel.jefe.hp / juego.nivel.jefe.maxHp, "#b93930", juego.nivel.jefe.nombre);
    for (let i = 1; i < juego.nivel.jefe.fasesMax; i++) {
      const x = 230 + 500 * (i / juego.nivel.jefe.fasesMax);
      g.fillStyle = "#1a100c";
      g.fillRect(x - 2, 62, 4, 22);
    }
    texto(g, juego.nivel.jefe.dialogo, 480, 104, 18, "center", "#ffef9b");
  }
  if (juego.combo > 2) {
    const tam = juego.combo >= 5 ? 42 : juego.combo >= 4 ? 34 : juego.combo >= 3 ? 28 : 22;
    const color = juego.combo >= 5 ? "#ffef9b" : juego.combo >= 4 ? "#c74334" : juego.combo >= 3 ? "#e0924e" : "#ffef9b";
    texto(g, `x${juego.combo.toFixed(1)}`, juego.jugador.x - juego.camara.x, juego.jugador.y - 88 + Math.sin(juego.t * 8) * 5, tam, "center", color);
  }
  g.restore();
}

export function dibujarPausa(g, juego) {
  g.save();
  g.fillStyle = "rgba(20, 11, 8, 0.62)";
  g.fillRect(0, 0, 960, 720);
  texto(g, "PAUSA", 480, 230, 70);
  ["CONTINUAR", "REINICIAR NIVEL", "VOLVER AL MAPA", "CONFIGURACION"].forEach((op, i) => {
    texto(g, `${juego.pausaMenu === i ? ">" : " "} ${op}`, 480, 330 + i * 44, 27, "center", juego.pausaMenu === i ? "#ffef9b" : "#f1dfb8");
  });
  texto(g, "FLECHAS: ELEGIR    ENTER: CONFIRMAR", 480, 555, 21);
  texto(g, "Z/ESPACIO salto  X disparo  C dash  V super", 480, 605, 19, "center", "#d8a342");
  g.restore();
}
