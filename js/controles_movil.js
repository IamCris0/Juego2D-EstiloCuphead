import { input } from "./input.js";

export function iniciarControlesMovil() {
  const movil = /Mobi|Android|Touch/i.test(navigator.userAgent) || window.matchMedia("(pointer: coarse)").matches;
  if (!movil) return;

  const capa = document.createElement("div");
  capa.className = "control-movil";
  capa.innerHTML = `
    <div class="joystick" data-joy><div class="stick" data-stick></div></div>
    <button class="boton tactil saltar" data-key="KeyZ">SALTAR</button>
    <button class="boton tactil disparar" data-key="KeyX">DISPARAR</button>
    <button class="boton tactil dash" data-key="KeyC">DASH</button>
    <button class="boton tactil super" data-key="KeyV">SUPER</button>
    <button class="boton tactil pausa" data-key="Escape">PAUSA</button>
  `;
  document.body.appendChild(capa);

  const joy = capa.querySelector("[data-joy]");
  const stick = capa.querySelector("[data-stick]");
  let joyId = null;
  let centro = { x: 0, y: 0 };

  function centrar() {
    stick.style.transform = "translate(-50%, -50%)";
    input.tactilJoystick(0, 0);
  }

  joy.addEventListener("pointerdown", e => {
    joyId = e.pointerId;
    joy.setPointerCapture(e.pointerId);
    const r = joy.getBoundingClientRect();
    centro = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });

  joy.addEventListener("pointermove", e => {
    if (e.pointerId !== joyId) return;
    const dx = e.clientX - centro.x;
    const dy = e.clientY - centro.y;
    const mag = Math.min(45, Math.hypot(dx, dy));
    const ang = Math.atan2(dy, dx);
    const x = Math.cos(ang) * mag;
    const y = Math.sin(ang) * mag;
    stick.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
    input.tactilJoystick(mag > 15 ? x / 45 : 0, mag > 15 ? y / 45 : 0);
  });

  for (const ev of ["pointerup", "pointercancel", "lostpointercapture"]) {
    joy.addEventListener(ev, e => {
      if (e.pointerId === joyId || ev === "lostpointercapture") {
        joyId = null;
        centrar();
      }
    });
  }

  capa.querySelectorAll("[data-key]").forEach(btn => {
    const code = btn.dataset.key;
    btn.addEventListener("pointerdown", e => {
      e.preventDefault();
      btn.setPointerCapture(e.pointerId);
      input.tactilTecla(code, true);
    });
    for (const ev of ["pointerup", "pointercancel", "lostpointercapture"]) {
      btn.addEventListener(ev, () => input.tactilTecla(code, false));
    }
  });
}
