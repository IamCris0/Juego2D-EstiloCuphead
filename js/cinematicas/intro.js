import { Cinematica } from "../cinematica.js";
import { ANCHO, ALTO, TAU, texto } from "../util.js";
import { audio } from "../audio.js";
import { sprites } from "../../sprites/sprites.js";

function maquina(g, s, x, y, t, tam = 26) {
  texto(g, s.slice(0, Math.floor(s.length * Math.min(1, t))), x, y, tam);
}

export function crearIntro() {
  return new Cinematica([
    { duracion: 3, dibujar(g, t, p) {
      if (!this.sono) { audio.sfx("intro"); this.sono = true; }
      g.fillStyle = "#080403"; g.fillRect(0, 0, ANCHO, ALTO);
      const radio = Math.min(760, p * 900);
      const luz = g.createRadialGradient(480, 360, 0, 480, 360, radio);
      luz.addColorStop(0, "#6f563d");
      luz.addColorStop(1, "#080403");
      g.fillStyle = luz; g.fillRect(0, 0, ANCHO, ALTO);
      if (Math.floor(t * 12) !== this.ultimaLetra) { audio.sfx("maquinaEscribir"); this.ultimaLetra = Math.floor(t * 12); }
      maquina(g, "ESTUDIO DE TINTA", 480, 300, t / 1.5, 58);
      maquina(g, "presenta una cinta jugable", 480, 370, t / 2.2, 24);
    } },
    { duracion: 4, dibujar(g, t) {
      g.fillStyle = "#6f563d"; g.fillRect(0, 0, ANCHO, ALTO);
      const suelo = 510;
      const tiempos = [1.35, 2.25, 3.0];
      const rebote = tiempos.reduce((a, b) => a + Math.max(0, 1 - Math.abs(t - b) * 5), 0);
      const y = Math.min(suelo, 60 + 520 * t * t * 0.22) - rebote * 70;
      g.fillStyle = "rgba(0,0,0,0.35)";
      g.beginPath(); g.ellipse(480, suelo + 48, 35 + y / 12, 14, 0, 0, TAU); g.fill();
      if (rebote > 0.85 && !this[`rebote${Math.floor(t * 3)}`]) {
        this[`rebote${Math.floor(t * 3)}`] = true;
        audio.sfx("dash");
      }
      g.save();
      g.translate(480, y);
      g.scale(1 + rebote * 0.25, 1 - rebote * 0.18);
      g.drawImage(sprites.jugador.tacita.idle[Math.floor(t * 8) % 3], -60, -75, 120, 140);
      g.restore();
      texto(g, "Habia una vez una taza muy valiente...", 480, 615, 28);
    } },
    { duracion: 3, dibujar(g, t, p) {
      if (!this.sono) { audio.sfx("boomJefe"); this.sono = true; }
      g.fillStyle = "#211611"; g.fillRect(0, 0, ANCHO, ALTO);
      g.fillStyle = `rgba(170,20,20,${Math.max(0, 1 - t * 2)})`; g.fillRect(0, 0, ANCHO, ALTO);
      g.fillStyle = "#ff2d2d";
      g.beginPath(); g.ellipse(430, 305, 10 + Math.sin(t * 20) * 4, 18, 0, 0, TAU); g.fill();
      g.beginPath(); g.ellipse(530, 305, 10 + Math.cos(t * 20) * 4, 18, 0, 0, TAU); g.fill();
      g.save();
      g.translate(480, 340);
      g.scale(1 + Math.sin(t * 8) * 0.06, Math.min(1, t));
      g.drawImage(sprites.jefes.diablo, -145, -110, 290, 230);
      g.restore();
      const frase = "...y un diablo muy porcelain-ado.";
      const visible = frase.slice(0, Math.floor(frase.length * p));
      texto(g, visible, 480 + (Math.random() - 0.5) * (p < 0.9 ? 4 : 0), 610, 28, "center", Math.sin(t * 18) > 0.65 ? "#c74334" : "#ffef9b");
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
      g.save(); g.translate(480, 380 + p * 80); g.scale(1 + Math.sin(t * 14) * 0.18, Math.max(0.05, 1 - p)); g.drawImage(sprites.jefes.diablo, -150, -120, 300, 240); g.restore();
      texto(g, "El diablo se derrite...", 480, 620, 28);
    } },
    { duracion: 3, dibujar(g, t) {
      g.fillStyle = "#6f563d"; g.fillRect(0, 0, ANCHO, ALTO);
      for (let i = 0; i < 80; i++) {
        g.fillStyle = i % 2 ? "#f4d35e" : "#f1dfb8";
        g.save(); g.translate((i * 83) % ANCHO, (t * (130 + i % 5 * 20) + i * 37) % ALTO); g.rotate(t * 5 + i); g.fillRect(-4, -6, 8, 12); g.restore();
      }
      texto(g, "VICTORIA TOTAL", 480, 330, 70, "center", "#ffef9b");
    } },
    { duracion: 4, dibujar(g, t) {
      g.fillStyle = "#8aa05d"; g.fillRect(0, 0, ANCHO, ALTO);
      const lista = sprites.jugador[juego.guardado.personaje].victoria;
      g.drawImage(lista[Math.floor(t * 8) % lista.length], 410, 245, 140, 160);
      for (let i = 0; i < 20; i++) { g.fillStyle = "#f4d35e"; g.beginPath(); g.arc(380 + (i * 17 + t * 60) % 220, 430 + Math.sin(t * 4 + i) * 25, 3, 0, TAU); g.fill(); }
      maquina(g, "La porcelana brilla de nuevo.", 480, 585, t / 3.2, 30);
    } },
    { duracion: 3, dibujar(g, t) {
      g.fillStyle = "#080403"; g.fillRect(0, 0, ANCHO, ALTO);
      const y = 520 - t * 70;
      texto(g, "Creado con Canvas & Web Audio", 480, y, 36);
      texto(g, `Puntuacion final: ${juego.puntos}`, 480, y + 80, 28);
      texto(g, `Grado final: ${juego.resultado?.grado || "A"}`, 480, y + 130, 28, "center", "#ffef9b");
    } }
  ]);
}

export function crearIntroJefe(jefe) {
  return new Cinematica([
    { duracion: 2.5, dibujar(g, t, p) {
      if (!this.sono) { audio.sfx("boomJefe"); this.sono = true; }
      g.fillStyle = "#211611"; g.fillRect(0, 0, ANCHO, ALTO);
      if (t < 0.3) return;
      g.save();
      g.translate(480, 335);
      const s = 0.45 + p * 0.9;
      g.scale(s, s);
      if (jefe.tipo === "arbol") g.scale(1, p);
      if (jefe.tipo === "diablo") g.translate(0, (1 - p) * 120);
      g.drawImage(sprites.jefes[jefe.tipo], -120, -95, 240, 190);
      g.restore();
      if (jefe.tipo === "nube") {
        g.strokeStyle = "#ffef9b"; g.lineWidth = 6;
        g.beginPath(); g.moveTo(260, 180); g.lineTo(310, 260); g.lineTo(280, 260); g.lineTo(330, 345); g.stroke();
        g.beginPath(); g.moveTo(700, 180); g.lineTo(650, 260); g.lineTo(680, 260); g.lineTo(630, 345); g.stroke();
      }
      if (jefe.tipo === "joker") for (let i = 0; i < 7; i++) { g.fillStyle = "#f1dfb8"; g.fillRect(300 + i * 55, 230 + Math.sin(t * 8 + i) * 20, 26, 40); }
      texto(g, jefe.nombre, 480, 105, 44, "center", "#ffef9b");
      g.fillStyle = "#f1dfb8"; g.strokeStyle = "#1a100c"; g.lineWidth = 5;
      g.beginPath(); g.roundRect(250, 535, 460, 70, 12); g.fill(); g.stroke();
      texto(g, jefe.dialogo, 480, 570, 24, "center", "#1a100c");
      g.fillStyle = "#1a100c"; g.fillRect(230, 650, 500, 18);
      g.fillStyle = "#b93930"; g.fillRect(233, 653, 494 * p, 12);
    } }
  ]);
}
