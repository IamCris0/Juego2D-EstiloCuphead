import { TAU, tinta } from "../js/util.js";

export const sprites = {};

function crearSprite(w, h, dibujar) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d");
  g.lineCap = "round";
  g.lineJoin = "round";
  dibujar(g, w, h);
  return c;
}

function dibujarCara(g, x, y, expresion = "feliz") {
  g.fillStyle = "#1a100c";
  if (expresion === "x") {
    g.lineWidth = 4;
    g.strokeStyle = "#1a100c";
    for (const dx of [-9, 9]) {
      g.beginPath();
      g.moveTo(x + dx - 5, y - 7);
      g.lineTo(x + dx + 5, y + 7);
      g.moveTo(x + dx + 5, y - 7);
      g.lineTo(x + dx - 5, y + 7);
      g.stroke();
    }
  } else {
    g.beginPath(); g.ellipse(x - 9, y, 4, 8, 0, 0, TAU); g.fill();
    g.beginPath(); g.ellipse(x + 9, y, 4, 8, 0, 0, TAU); g.fill();
  }
  g.strokeStyle = "#1a100c";
  g.lineWidth = 3;
  g.beginPath();
  g.arc(x, y + 13, expresion === "miedo" ? 5 : 9, expresion === "miedo" ? 0 : 0.1, expresion === "miedo" ? TAU : Math.PI - 0.1);
  g.stroke();
}

export function construirSprites() {
  const colores = {
    tacita: ["#f3e1bd", "#b72f2a"],
    platon: ["#d8e6d0", "#2f7e75"],
    tetito: ["#f0c2df", "#7f4ca5"]
  };

  sprites.jugador = {};
  for (const [nombre, paleta] of Object.entries(colores)) {
    sprites.jugador[nombre] = {};
    for (const estado of ["idle", "correr", "saltar", "caer", "disparar", "golpeado", "victoria", "deslizar", "golpe"]) {
      const frames = estado === "correr" ? 8 : estado === "victoria" ? 4 : 3;
      sprites.jugador[nombre][estado] = Array.from({ length: frames }, (_, i) => crearSprite(86, 98, g => {
        const bob = Math.sin(i / frames * TAU) * (estado === "idle" ? 3 : 6);
        const estirar = estado === "saltar" ? 1.12 : estado === "caer" ? 0.88 : estado === "deslizar" ? 0.52 : 1;
        g.save();
        g.translate(43, 48 + bob);
        g.scale(1 / estirar, estirar);
        tinta(g, paleta[0]);
        if (nombre === "platon") {
          g.beginPath(); g.ellipse(0, 0, 30, 18, 0, 0, TAU); g.fill(); g.stroke();
          g.beginPath(); g.ellipse(0, 0, 19, 10, 0, 0, TAU); g.stroke();
        } else if (nombre === "tetito") {
          g.beginPath(); g.ellipse(0, 0, 24, 26, 0, 0, TAU); g.fill(); g.stroke();
          g.beginPath(); g.arc(25, -2, 10, -1.2, 1.2); g.stroke();
          g.beginPath(); g.moveTo(-24, -5); g.lineTo(-38, -12); g.stroke();
        } else {
          g.beginPath(); g.ellipse(0, 0, 24, 27, 0, 0, TAU); g.fill(); g.stroke();
          g.beginPath(); g.ellipse(0, -21, 28, 12, 0, 0, TAU); g.fillStyle = "#fff0cf"; g.fill(); g.stroke();
          g.beginPath(); g.arc(24, -1, 10, -1.2, 1.2); g.strokeStyle = "#1a100c"; g.lineWidth = 4; g.stroke();
        }
        g.strokeStyle = paleta[1]; g.lineWidth = 6;
        g.beginPath(); g.moveTo(-2, -31); g.quadraticCurveTo(15, -45 - bob, 24, -32); g.stroke();
        dibujarCara(g, 0, -7, estado === "golpeado" ? "x" : estado === "caer" ? "miedo" : "feliz");
        g.strokeStyle = "#1a100c"; g.lineWidth = 5;
        const paso = estado === "correr" ? Math.sin(i / frames * TAU) * 12 : estado === "victoria" ? Math.sin(i / frames * TAU) * 8 : 0;
        g.beginPath(); g.moveTo(-12, 21); g.quadraticCurveTo(-23 + paso, 37, -29, 45); g.stroke();
        g.beginPath(); g.moveTo(12, 21); g.quadraticCurveTo(24 - paso, 37, 30, 45); g.stroke();
        g.beginPath(); g.moveTo(-21, 7); g.quadraticCurveTo(-36, 10 + paso * 0.4, -32, 24); g.stroke();
        g.beginPath(); g.moveTo(21, 7); g.quadraticCurveTo(38, 8 - paso * 0.4, 35, 23); g.stroke();
        if (estado === "disparar" || estado === "golpe") {
          g.strokeStyle = "#1a100c"; g.lineWidth = 7;
          g.beginPath(); g.moveTo(20, 5); g.lineTo(estado === "golpe" ? 56 : 46, estado === "golpe" ? -6 : -1); g.stroke();
          g.fillStyle = estado === "golpe" ? "#fff6dd" : "#ffef9b"; g.beginPath(); g.arc(estado === "golpe" ? 62 : 51, estado === "golpe" ? -6 : -1, estado === "golpe" ? 11 : 8, 0, TAU); g.fill();
        }
        g.restore();
      }));
    }
  }

  sprites.plano = crearSprite(102, 66, g => {
    tinta(g, "#c74334");
    g.beginPath(); g.ellipse(48, 34, 35, 16, 0, 0, TAU); g.fill(); g.stroke();
    g.fillStyle = "#eecb75"; g.beginPath(); g.ellipse(82, 33, 11, 15, 0, 0, TAU); g.fill(); g.stroke();
    g.fillStyle = "#f3e1bd"; g.beginPath(); g.ellipse(31, 24, 17, 18, 0, 0, TAU); g.fill(); g.stroke();
    dibujarCara(g, 31, 22);
    g.strokeStyle = "#1a100c"; g.lineWidth = 4;
    g.beginPath(); g.moveTo(75, 33); g.lineTo(100, 24); g.moveTo(75, 33); g.lineTo(100, 42); g.stroke();
    g.fillStyle = "#2f7e75"; g.beginPath(); g.ellipse(45, 53, 31, 7, 0, 0, TAU); g.fill(); g.stroke();
  });

  sprites.enemigos = {};
  for (const tipo of ["rana", "pajaro", "hongo", "tortuga", "avioneta", "globo", "nube", "murcielago", "naipe", "ficha", "tragamonedas", "pez", "medusa", "cangrejo", "anguila", "clon"]) {
    sprites.enemigos[tipo] = crearSprite(70, 62, g => {
      const color = {
        rana: "#6d9a4b", pajaro: "#b8793d", hongo: "#a64a3a", tortuga: "#657a54",
        avioneta: "#c74334", globo: "#d85c7f", nube: "#d8d1bd", murcielago: "#554069",
        naipe: "#f1dfb8", ficha: "#d8a342", tragamonedas: "#6d6a65", pez: "#e18e59",
        medusa: "#9c71b8", cangrejo: "#b94435", anguila: "#707b9b", clon: "#f3e1bd"
      }[tipo] || "#8f5f37";
      tinta(g, color);
      g.beginPath();
      if (tipo === "naipe") g.roundRect(18, 8, 34, 46, 5);
      else g.ellipse(35, 31, 24, 19, 0, 0, TAU);
      g.fill(); g.stroke();
      dibujarCara(g, 35, 25);
      g.strokeStyle = "#1a100c"; g.lineWidth = 4;
      if (["pajaro", "murcielago", "avioneta"].includes(tipo)) {
        g.beginPath(); g.ellipse(12, 18, 16, 7, 0.4, 0, TAU); g.stroke();
        g.beginPath(); g.ellipse(58, 18, 16, 7, -0.4, 0, TAU); g.stroke();
      }
      if (tipo === "medusa") for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(20 + i * 10, 46); g.quadraticCurveTo(18 + i * 12, 58, 24 + i * 9, 61); g.stroke(); }
      if (tipo === "cangrejo") { g.beginPath(); g.arc(11, 25, 9, 0, TAU); g.stroke(); g.beginPath(); g.arc(59, 25, 9, 0, TAU); g.stroke(); }
    });
  }

  sprites.jefes = {};
  for (const tipo of ["arbol", "nube", "joker", "pulpo", "diablo", "cocodrilo"]) {
    sprites.jefes[tipo] = crearSprite(240, 190, g => {
      const color = { arbol: "#7d593c", nube: "#5f6477", joker: "#b94355", pulpo: "#8f4b79", diablo: "#9b2f24", cocodrilo: "#557a45" }[tipo];
      tinta(g, color);
      g.beginPath(); g.ellipse(120, 95, 76, 64, 0, 0, TAU); g.fill(); g.stroke();
      if (tipo === "arbol") {
        g.fillStyle = "#42683c"; for (let i = 0; i < 7; i++) { g.beginPath(); g.arc(55 + i * 22, 40 + Math.sin(i) * 15, 25, 0, TAU); g.fill(); g.stroke(); }
      }
      if (tipo === "pulpo") for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(70 + i * 24, 145); g.quadraticCurveTo(35 + i * 38, 185, 80 + i * 18, 186); g.stroke(); }
      if (tipo === "diablo") {
        g.fillStyle = "#1a100c"; g.beginPath(); g.moveTo(82, 42); g.lineTo(60, 5); g.lineTo(105, 36); g.fill();
        g.beginPath(); g.moveTo(158, 42); g.lineTo(180, 5); g.lineTo(135, 36); g.fill();
      }
      dibujarCara(g, 120, 82, "feliz");
      g.strokeStyle = "#1a100c"; g.lineWidth = 8;
      g.beginPath(); g.arc(120, 113, 32, 0.08, Math.PI - 0.08); g.stroke();
    });
  }
}
