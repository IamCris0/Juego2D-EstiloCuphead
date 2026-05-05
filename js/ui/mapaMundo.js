import { ANCHO, texto, tinta } from "../util.js";
import { MUNDOS } from "../nivel.js";
import { fondoMenu } from "./pantallaTitulo.js";
import { claveSubnivel, subnivelDesbloqueado } from "../guardado.js";

export const ITEMS_TIENDA = [
  { nombre: "Vida Extra", id: "vida", costo: 8, max: 3, desc: "+1 corazon al iniciar cada nivel" },
  { nombre: "Cadencia", id: "cadencia", costo: 7, max: 5, desc: "Dispara mas rapido, reduce espera entre balas" },
  { nombre: "Velocidad", id: "velocidad", costo: 6, max: 5, desc: "Muevete mas rapido al correr y en el aire" },
  { nombre: "Metro Super", id: "super", costo: 9, max: 3, desc: "Super se carga mas rapido al golpear enemigos" },
  { nombre: "Doble Disparo", id: "doble", costo: 12, max: 1, desc: "Cada disparo lanza 2 balas en paralelo" },
  { nombre: "Parry Automatico", id: "parryAuto", costo: 15, max: 1, desc: "Las balas rosas se paran solas al acercarse" },
  { nombre: "Escudo de Tinta", id: "escudo", costo: 11, max: 2, desc: "Primer golpe de cada nivel absorbido gratis" },
  { nombre: "Dash Cargado", id: "dashCargado", costo: 10, max: 1, desc: "El dash deja una explosion de particulas al terminar" },
  { nombre: "Bala Rebotadora", id: "rebote", costo: 13, max: 1, desc: "Las balas rebotan en paredes una vez" },
  { nombre: "Combo Maestro", id: "combo", costo: 8, max: 3, desc: "El multiplicador de combo baja mas lento" }
];

export function dibujarMapa(g, juego) {
  fondoMenu(g, juego.t);
  const cx = ANCHO / 2;
  texto(g, "MAPA DEL MUNDO", cx, 72, 54);
  const nodos = [
    { x: cx - 480, y: 420 }, { x: cx - 240, y: 300 }, { x: cx, y: 420 }, { x: cx + 240, y: 300 }, { x: cx + 480, y: 430 }
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
    const grado = juego.guardado.grados[`${i + 1}-3`] || juego.guardado.grados[i + 1];
    if (grado) texto(g, `GRADO ${grado}`, n.x, n.y + 101, 17, "center", "#ffef9b");
  });
  texto(g, "ENTER: JUGAR    T: TIENDA    L: CAMPEONES    G: LOGROS    S: CONFIGURACION", cx, 635, 19);
  if (juego.guardado.dificil) texto(g, "MODO DIFICIL DESBLOQUEADO", cx, 675, 20, "center", "#ffef9b");
}

export function dibujarSubmundo(g, juego) {
  fondoMenu(g, juego.t);
  const mundo = MUNDOS[juego.mundoSeleccionado - 1];
  const cx = ANCHO / 2;
  texto(g, mundo.nombre.toUpperCase(), cx, 82, 50);
  const nombres = ["Zona de practica", "Zona principal", "Jefe del mundo"];
  for (let i = 0; i < 3; i++) {
    const sub = i + 1;
    const y = 230 + i * 135;
    const abierto = subnivelDesbloqueado(juego.mundoSeleccionado, sub);
    const sel = juego.subMenu === i;
    tinta(g, abierto ? (sel ? "#f1c75b" : "#e5c48c") : "#5d5044", "#1a100c", sel ? 7 : 5);
    g.beginPath();
    g.arc(cx - 260, y, sel ? 44 : 36, 0, Math.PI * 2);
    g.fill();
    g.stroke();
    texto(g, abierto ? `${sub}` : "X", cx - 260, y + 2, 30, "center", abierto ? "#1a100c" : "#2c221e");
    texto(g, nombres[i], cx, y - 12, sel ? 34 : 29, "center", abierto ? "#f4e3bd" : "#9b8a6c");
    const grado = juego.guardado.grados[claveSubnivel(juego.mundoSeleccionado, sub)];
    texto(g, grado ? `GRADO ${grado}` : abierto ? "SIN COMPLETAR" : "CANDADO", cx, y + 30, 21, "center", grado ? "#ffef9b" : "#d8a342");
  }
  texto(g, "ARRIBA/ABAJO: ELEGIR    ENTER: JUGAR    ESC: MAPA", cx, 640, 23);
}

export function dibujarTienda(g, juego) {
  fondoMenu(g, juego.t);
  const cx = ANCHO / 2;
  texto(g, "TIENDA ENTRE MUNDOS", cx, 85, 52);
  texto(g, `MONEDAS DISPONIBLES ${juego.guardado.monedas}`, cx, 145, 24, "center", "#ffef9b");
  const inicio = Math.max(0, Math.min(juego.menu - 1, ITEMS_TIENDA.length - 4));
  ITEMS_TIENDA.slice(inicio, inicio + 4).forEach((it, idx) => {
    const i = inicio + idx;
    const y = 225 + idx * 78;
    const nivel = juego.guardado.mejoras[it.id] || 0;
    const comprable = juego.guardado.monedas >= it.costo && nivel < it.max;
    const sel = juego.menu === i;
    const color = sel ? "#ffef9b" : comprable ? "#b7e3a1" : "#8e8576";
    const tam = sel ? 31 : 25;
    texto(g, `${sel ? ">" : " "} ${it.nombre}  NIVEL ${nivel}/${it.max}  COSTO ${it.costo}`, cx, y, tam, "center", color);
  });
  const item = ITEMS_TIENDA[juego.menu];
  const nivel = juego.guardado.mejoras[item.id] || 0;
  const comprable = juego.guardado.monedas >= item.costo && nivel < item.max;
  tinta(g, "rgba(29,18,13,0.75)", comprable ? "#7ac16b" : "#6b6259", 4);
  g.beginPath();
  g.roundRect(cx - 400, 555, 800, 82, 8);
  g.fill();
  g.stroke();
  texto(g, item.desc, cx, 585, 22, "center", "#f4e3bd");
  texto(g, comprable ? "ENTER: COMPRAR" : nivel >= item.max ? "MEJORA AL MAXIMO" : "MONEDAS INSUFICIENTES", cx, 617, 20, "center", comprable ? "#b7e3a1" : "#8e8576");
  texto(g, "ARRIBA/ABAJO: ELEGIR    ESC: MAPA", cx, 675, 21);
}
