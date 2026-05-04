import { texto, tinta } from "../util.js";
import { MUNDOS } from "../nivel.js";
import { fondoMenu } from "./pantallaTitulo.js";

export function dibujarMapa(g, juego) {
  fondoMenu(g, juego.t);
  texto(g, "MAPA DEL MUNDO", 480, 72, 54);
  const nodos = [
    { x: 150, y: 420 }, { x: 330, y: 300 }, { x: 510, y: 420 }, { x: 690, y: 300 }, { x: 830, y: 430 }
  ];
  g.strokeStyle = "#1a100c";
  g.lineWidth = 10;
  g.beginPath();
  g.moveTo(nodos[0].x, nodos[0].y);
  for (let i = 1; i < nodos.length; i++) g.quadraticCurveTo((nodos[i - 1].x + nodos[i].x) / 2, 210 + i * 20, nodos[i].x, nodos[i].y);
  g.stroke();
  nodos.forEach((n, i) => {
    const desbloqueado = i + 1 <= juego.guardado.desbloqueado;
    const seleccionado = i === juego.menu;
    g.save();
    g.translate(n.x, n.y + Math.sin(juego.t * 4 + i) * 6);
    tinta(g, desbloqueado ? (seleccionado ? "#f1c75b" : "#e5c48c") : "#5d5044", "#1a100c", seleccionado ? 7 : 5);
    g.beginPath();
    g.arc(0, 0, seleccionado ? 43 : 36, 0, Math.PI * 2);
    g.fill();
    g.stroke();
    texto(g, `${i + 1}`, 0, 2, 31, "center", desbloqueado ? "#1a100c" : "#2c221e");
    g.restore();
    texto(g, MUNDOS[i].nombre, n.x, n.y + 72, 20, "center", desbloqueado ? "#f4e3bd" : "#9b8a6c");
    const grado = juego.guardado.grados[i + 1];
    if (grado) texto(g, `GRADO ${grado}`, n.x, n.y + 101, 17, "center", "#ffef9b");
  });
  texto(g, "ENTER: JUGAR    T: TIENDA    S: CONFIGURACION", 480, 635, 23);
  if (juego.guardado.dificil) texto(g, "MODO DIFICIL DESBLOQUEADO", 480, 675, 20, "center", "#ffef9b");
}

export function dibujarTienda(g, juego) {
  fondoMenu(g, juego.t);
  texto(g, "TIENDA ENTRE MUNDOS", 480, 85, 52);
  texto(g, `MONEDAS DISPONIBLES ${juego.guardado.monedas}`, 480, 145, 24, "center", "#ffef9b");
  const items = [
    ["Vida extra", "vida", 8],
    ["Cadencia", "cadencia", 7],
    ["Velocidad", "velocidad", 6],
    ["Super metro", "super", 9]
  ];
  items.forEach((it, i) => {
    const y = 245 + i * 82;
    const sel = juego.menu === i;
    texto(g, `${sel ? ">" : " "} ${it[0]}  NIVEL ${juego.guardado.mejoras[it[1]]}  COSTO ${it[2]}`, 480, y, 31, "center", sel ? "#ffef9b" : "#f1dfb8");
  });
  texto(g, "ARRIBA/ABAJO: ELEGIR    ENTER: COMPRAR    ESC: MAPA", 480, 635, 22);
}
