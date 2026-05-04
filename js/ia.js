import { clamp, dist, lerp } from "./util.js";

export const ESTADOS_IA = {
  PATRULLAR: "PATRULLAR",
  ALERTA: "ALERTA",
  PERSEGUIR: "PERSEGUIR",
  ATACAR: "ATACAR",
  RETROCEDER: "RETROCEDER",
  ATURDIR: "ATURDIR",
  HUIR: "HUIR"
};

export function actualizarIA(enemigo, juego, dt) {
  const jugador = juego.jugador;
  const distancia = dist(enemigo, jugador);
  enemigo.estadoTiempo += dt;
  enemigo.cooldown -= dt;

  if (enemigo.aturdido > 0) {
    enemigo.estado = ESTADOS_IA.ATURDIR;
    enemigo.aturdido -= dt;
    enemigo.vx *= 0.94;
    return;
  }

  if (enemigo.hp < enemigo.maxHp * 0.2) enemigo.estado = ESTADOS_IA.HUIR;
  else if (distancia < 90) enemigo.estado = ESTADOS_IA.RETROCEDER;
  else if (distancia < 400 && enemigo.cooldown <= 0) enemigo.estado = ESTADOS_IA.ATACAR;
  else if (distancia < 400) enemigo.estado = ESTADOS_IA.ALERTA;
  else enemigo.estado = ESTADOS_IA.PATRULLAR;

  enemigo.direccion = jugador.x >= enemigo.x ? 1 : -1;

  if (enemigo.estado === ESTADOS_IA.PATRULLAR) {
    enemigo.x += Math.sin(enemigo.t * enemigo.patrullaVel) * enemigo.patrullaAmp * dt;
  } else if (enemigo.estado === ESTADOS_IA.ALERTA) {
    enemigo.vx = lerp(enemigo.vx, 0, 0.1);
  } else if (enemigo.estado === ESTADOS_IA.PERSEGUIR) {
    enemigo.x += enemigo.direccion * enemigo.velocidad * dt;
  } else if (enemigo.estado === ESTADOS_IA.RETROCEDER || enemigo.estado === ESTADOS_IA.HUIR) {
    enemigo.x -= enemigo.direccion * enemigo.velocidad * 1.2 * dt;
  }

  enemigo.x = clamp(enemigo.x, enemigo.zona[0], enemigo.zona[1]);
}

export function predecirJugador(enemigo, jugador, adelanto = 0.45) {
  return {
    x: jugador.x + jugador.vx * adelanto,
    y: jugador.y + jugador.vy * adelanto
  };
}

export function registrarPosicionJefe(jefe, jugador) {
  jefe.memoria.push({ x: jugador.x, y: jugador.y, t: performance.now() });
  while (jefe.memoria.length > 3) jefe.memoria.shift();
}

export function tacticaRepetida(jefe) {
  if (jefe.memoria.length < 3) return false;
  const [a, b, c] = jefe.memoria;
  return Math.abs(a.y - b.y) < 45 && Math.abs(b.y - c.y) < 45 && Math.abs(a.x - b.x) < 140 && Math.abs(b.x - c.x) < 140;
}
