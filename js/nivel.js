import { Enemigo } from "./enemigo.js";
import { Jefe } from "./jefe.js";
import { rand } from "./util.js";

export const MUNDOS = [
  { id: 1, nombre: "Selva de Tinta", modo: "run", jefe: "arbol", mid: "cocodrilo" },
  { id: 2, nombre: "Cielos de Caramelo", modo: "aereo", jefe: "nube" },
  { id: 3, nombre: "Casino Maldito", modo: "run", jefe: "joker" },
  { id: 4, nombre: "Abismo Oceanico", modo: "submarino", jefe: "pulpo" },
  { id: 5, nombre: "Fabrica Infernal", modo: "jefe", jefe: "diablo" }
];

export function crearNivel(id) {
  return crearSubNivel(id, 2);
}

export function crearSubNivel(id, subId) {
  const mundo = MUNDOS[id - 1];
  const ancho = subId === 1 ? 2200 : subId === 3 ? 960 : 5200;
  const nivel = {
    id,
    subId,
    nombre: mundo.nombre,
    nombreSub: ["Zona de practica", "Zona principal", "Jefe del mundo"][subId - 1],
    modo: mundo.modo,
    ancho,
    tiempoLimite: subId === 1 ? 90 : subId === 3 ? 220 : 170,
    plataformas: [],
    enemigos: [],
    monedas: [],
    jefe: null,
    submarino: mundo.modo === "submarino",
    victoriaFinal: false
  };
  if (subId === 3 || mundo.modo === "jefe") {
    nivel.modo = mundo.modo === "aereo" || mundo.modo === "submarino" ? mundo.modo : "jefe";
    nivel.submarino = mundo.modo === "submarino";
    if (nivel.modo === "jefe") nivel.plataformas.push({ x: 0, y: 640, w: 960, h: 100 });
    nivel.jefe = new Jefe(mundo.jefe, 705, id === 4 ? 330 : 300);
    nivel.jefe.activo = true;
    return nivel;
  }
  if (mundo.modo === "run") crearRunGun(nivel, id, subId);
  if (mundo.modo === "aereo" || mundo.modo === "submarino") crearAereo(nivel, id, subId);
  return nivel;
}

function crearRunGun(nivel, id, subId) {
  nivel.plataformas.push({ x: 0, y: 620, w: nivel.ancho + 120, h: 120 });
  const alturas = id === 1 ? [500, 455, 500, 450, 500, 430] : [520, 470, 420, 500, 455, 410];
  alturas.forEach((y, i) => nivel.plataformas.push({ x: 620 + i * 520, y, w: 190 + (i % 2) * 60, h: 28 }));
  const tipos = id === 1 ? ["rana", "pajaro", "hongo", "tortuga"] : ["naipe", "ficha", "tragamonedas", "naipe"];
  const total = subId === 1 ? 10 : 20;
  const paso = subId === 1 ? 145 : 190;
  for (let i = 0; i < total; i++) {
    const x = 360 + i * paso;
    const y = tipos[i % tipos.length] === "pajaro" || tipos[i % tipos.length] === "naipe" ? rand(260, 460) : 590;
    nivel.enemigos.push(new Enemigo(tipos[i % tipos.length], x, y, [x - 200, x + 200]));
  }
  if (subId === 2 && id === 1) nivel.enemigos.push(new Jefe("cocodrilo", 2250, 545));
  const monedas = subId === 1 ? 10 : 24;
  for (let i = 0; i < monedas; i++) nivel.monedas.push({ x: 330 + i * 180, y: 430 + Math.sin(i) * 80, w: 22, h: 22, tomada: false });
}

function crearAereo(nivel, id, subId) {
  const tipos = id === 2 ? ["avioneta", "globo", "nube", "murcielago"] : ["pez", "medusa", "cangrejo", "anguila"];
  const total = subId === 1 ? 10 : 20;
  for (let i = 0; i < total; i++) nivel.enemigos.push(new Enemigo(tipos[i % 4], 520 + i * (subId === 1 ? 140 : 190), rand(100, 600)));
  const monedas = subId === 1 ? 10 : 26;
  for (let i = 0; i < monedas; i++) nivel.monedas.push({ x: 420 + i * 190, y: rand(100, 590), w: 22, h: 22, tomada: false });
}
