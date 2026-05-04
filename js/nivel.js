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
  const mundo = MUNDOS[id - 1];
  const nivel = {
    id,
    nombre: mundo.nombre,
    modo: mundo.modo,
    ancho: mundo.modo === "jefe" ? 960 : 5200,
    tiempoLimite: id === 5 ? 220 : 170,
    plataformas: [],
    enemigos: [],
    monedas: [],
    jefe: null,
    submarino: mundo.modo === "submarino",
    victoriaFinal: false
  };
  if (mundo.modo === "run") crearRunGun(nivel, id);
  if (mundo.modo === "aereo" || mundo.modo === "submarino") crearAereo(nivel, id);
  if (mundo.modo === "jefe") {
    nivel.plataformas.push({ x: 0, y: 640, w: 960, h: 100 });
    nivel.jefe = new Jefe("diablo", 705, 300);
  }
  if (id !== 5) nivel.jefe = new Jefe(mundo.jefe, nivel.ancho - 260, id === 4 ? 330 : 300);
  return nivel;
}

function crearRunGun(nivel, id) {
  nivel.plataformas.push({ x: 0, y: 620, w: nivel.ancho + 120, h: 100 });
  const alturas = id === 1 ? [500, 455, 500, 450, 500, 430] : [520, 470, 420, 500, 455, 410];
  alturas.forEach((y, i) => nivel.plataformas.push({ x: 620 + i * 520, y, w: 190 + (i % 2) * 60, h: 28 }));
  const tipos = id === 1 ? ["rana", "pajaro", "hongo", "tortuga"] : ["naipe", "ficha", "tragamonedas", "naipe"];
  for (let i = 0; i < 20; i++) {
    const x = 460 + i * 190;
    const y = tipos[i % tipos.length] === "pajaro" || tipos[i % tipos.length] === "naipe" ? rand(260, 460) : 590;
    nivel.enemigos.push(new Enemigo(tipos[i % tipos.length], x, y, [x - 150, x + 150]));
  }
  if (id === 1) nivel.enemigos.push(new Jefe("cocodrilo", 2250, 545));
  for (let i = 0; i < 24; i++) nivel.monedas.push({ x: 330 + i * 180, y: 430 + Math.sin(i) * 80, w: 22, h: 22, tomada: false });
}

function crearAereo(nivel, id) {
  const tipos = id === 2 ? ["avioneta", "globo", "nube", "murcielago"] : ["pez", "medusa", "cangrejo", "anguila"];
  for (let i = 0; i < 32; i++) nivel.enemigos.push(new Enemigo(tipos[i % 4], 620 + i * 145, rand(100, 600)));
  for (let i = 0; i < 26; i++) nivel.monedas.push({ x: 420 + i * 190, y: rand(100, 590), w: 22, h: 22, tomada: false });
}
