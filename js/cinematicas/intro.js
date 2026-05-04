import { Cinematica } from "../cinematica.js";
import { ANCHO, ALTO, TAU, texto } from "../util.js";
import { sprites } from "../../sprites/sprites.js";

function maquina(g, s, x, y, t, tam = 26) {
  texto(g, s.slice(0, Math.floor(s.length * Math.min(1, t))), x, y, tam);
}

export function crearIntro() {
  return new Cinematica([
    { duracion: 3, dibujar(g, t, p) {
      g.fillStyle = "#080403"; g.fillRect(0, 0, ANCHO, ALTO);
      g.globalAlpha = p;
      texto(g, "ESTUDIO DE TINTA", 480, 300, 58, "center", "#f1dfb8");
      maquina(g, "presenta una cinta jugable", 480, 370, t / 2.2, 24);
      g.globalAlpha = 1;
    } },
    { duracion: 4, dibujar(g, t) {
      g.fillStyle = "#6f563d"; g.fillRect(0, 0, ANCHO, ALTO);
      const rebote = Math.abs(Math.sin(t * 4)) * Math.max(0, 1 - t / 4);
      const y = 135 + Math.min(420, t * 180) - rebote * 90;
      g.save();
      g.translate(480, y);
      g.scale(1 + rebote * 0.25, 1 - rebote * 0.18);
      g.drawImage(sprites.jugador.tacita.idle[Math.floor(t * 8) % 3], -60, -75, 120, 140);
      g.restore();
      texto(g, "Habia una vez una taza muy valiente...", 480, 615, 28);
    } },
    { duracion: 3, dibujar(g, t, p) {
      g.fillStyle = "#211611"; g.fillRect(0, 0, ANCHO, ALTO);
      g.save();
      g.translate(480, 340);
      g.scale(1 + Math.sin(t * 8) * 0.06, 1);
      g.drawImage(sprites.jefes.diablo, -145, -110, 290, 230);
      g.restore();
      texto(g, "...y un diablo muy porcelain-ado.", 480, 610, 28, "center", "#ffef9b");
    } },
    { duracion: 2, dibujar(g, t, p) {
      g.fillStyle = `rgba(8,4,3,${p})`; g.fillRect(0, 0, ANCHO, ALTO);
      texto(g, "PANICO DE PORCELANA", 480, 340, 62, "center", "#f1dfb8");
      texto(g, "ENTER: SALTAR", 480, 420, 22, "center", "#d8a342");
    } }
  ]);
}

export function crearVictoriaFinal(juego) {
  return new Cinematica([
    { duracion: 3, dibujar(g, t, p) {
      g.fillStyle = "#211611"; g.fillRect(0, 0, ANCHO, ALTO);
      g.save(); g.translate(480, 380); g.scale(1, Math.max(0.05, 1 - p)); g.drawImage(sprites.jefes.diablo, -150, -120, 300, 240); g.restore();
      texto(g, "El diablo se derrite...", 480, 620, 28);
    } },
    { duracion: 3, dibujar(g, t) {
      g.fillStyle = "#6f563d"; g.fillRect(0, 0, ANCHO, ALTO);
      for (let i = 0; i < 80; i++) {
        g.fillStyle = i % 2 ? "#f4d35e" : "#f1dfb8";
        g.beginPath(); g.arc((i * 83) % ANCHO, (t * 180 + i * 37) % ALTO, 5, 0, TAU); g.fill();
      }
      texto(g, "VICTORIA TOTAL", 480, 330, 70, "center", "#ffef9b");
    } },
    { duracion: 4, dibujar(g, t) {
      g.fillStyle = "#8aa05d"; g.fillRect(0, 0, ANCHO, ALTO);
      const lista = sprites.jugador[juego.guardado.personaje].victoria;
      g.drawImage(lista[Math.floor(t * 8) % lista.length], 410, 245, 140, 160);
      maquina(g, "La porcelana brilla de nuevo.", 480, 585, t / 3.2, 30);
    } },
    { duracion: 3, dibujar(g) {
      g.fillStyle = "#080403"; g.fillRect(0, 0, ANCHO, ALTO);
      texto(g, "Creado con Canvas & Web Audio", 480, 260, 36);
      texto(g, `Puntuacion final: ${juego.puntos}`, 480, 340, 28);
      texto(g, `Grado final: ${juego.resultado?.grado || "A"}`, 480, 390, 28, "center", "#ffef9b");
    } }
  ]);
}

export function crearIntroJefe(jefe) {
  return new Cinematica([
    { duracion: 2.5, dibujar(g, t, p) {
      g.fillStyle = "#211611"; g.fillRect(0, 0, ANCHO, ALTO);
      g.save();
      g.translate(480, 335);
      const s = 0.45 + p * 0.9;
      g.scale(s, s);
      g.drawImage(sprites.jefes[jefe.tipo], -120, -95, 240, 190);
      g.restore();
      texto(g, jefe.nombre, 480, 105, 44, "center", "#ffef9b");
      g.fillStyle = "#f1dfb8"; g.strokeStyle = "#1a100c"; g.lineWidth = 5;
      g.beginPath(); g.roundRect(250, 535, 460, 70, 12); g.fill(); g.stroke();
      texto(g, jefe.dialogo, 480, 570, 24, "center", "#1a100c");
    } }
  ]);
}
