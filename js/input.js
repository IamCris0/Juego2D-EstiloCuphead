const teclas = Object.create(null);
const pulsadas = Object.create(null);
const gamepads = new Map();
const joystick = { x: 0, y: 0 };

function marcar(codigo) {
  if (!teclas[codigo]) pulsadas[codigo] = true;
  teclas[codigo] = true;
}

window.addEventListener("keydown", e => {
  marcar(e.code);
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) e.preventDefault();
});

window.addEventListener("keyup", e => {
  teclas[e.code] = false;
});

window.addEventListener("gamepadconnected", e => gamepads.set(e.gamepad.index, e.gamepad));
window.addEventListener("gamepaddisconnected", e => gamepads.delete(e.gamepad.index));

function boton(i) {
  const pad = navigator.getGamepads?.()[0];
  return !!pad?.buttons[i]?.pressed;
}

function eje(i) {
  const pad = navigator.getGamepads?.()[0];
  const v = pad?.axes[i] || 0;
  return Math.abs(v) > 0.25 ? v : 0;
}

function consumir(codigo) {
  if (pulsadas[codigo]) {
    pulsadas[codigo] = false;
    return true;
  }
  return false;
}

export const input = {
  x() {
    return (teclas.ArrowRight || teclas.KeyD ? 1 : 0) - (teclas.ArrowLeft || teclas.KeyA ? 1 : 0) + eje(0) + joystick.x;
  },
  y() {
    return (teclas.ArrowDown || teclas.KeyS ? 1 : 0) - (teclas.ArrowUp || teclas.KeyW ? 1 : 0) + eje(1) + joystick.y;
  },
  salto() { return consumir("KeyZ") || consumir("Space") || boton(0); },
  disparoMantenido() { return teclas.KeyX || boton(2); },
  disparoPulso() { return consumir("KeyX") || boton(2); },
  dash() { return consumir("KeyC") || boton(1); },
  super() { return consumir("KeyV") || boton(3); },
  confirmar() { return consumir("Enter") || boton(9); },
  pausa() { return consumir("Enter") || consumir("Escape") || boton(9); },
  atras() { return consumir("Escape") || boton(8); },
  izq() { return consumir("ArrowLeft") || consumir("KeyA") || eje(0) < -0.5; },
  der() { return consumir("ArrowRight") || consumir("KeyD") || eje(0) > 0.5; },
  arriba() { return consumir("ArrowUp") || consumir("KeyW") || eje(1) < -0.5; },
  abajo() { return consumir("ArrowDown") || consumir("KeyS") || eje(1) > 0.5; },
  consumir,
  tactilTecla(codigo, abajo) {
    if (abajo) marcar(codigo);
    else teclas[codigo] = false;
  },
  tactilJoystick(x, y) {
    joystick.x = x;
    joystick.y = y;
  },
  cualquierPulso() {
    return Object.values(pulsadas).some(Boolean);
  },
  finFrame() {
    for (const k in pulsadas) pulsadas[k] = false;
  }
};
