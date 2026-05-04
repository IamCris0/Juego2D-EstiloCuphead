const CLAVE = "panico-porcelana-guardado-v2";

export const guardado = cargar();

function cargar() {
  const base = {
    record: 0,
    monedas: 0,
    desbloqueado: 1,
    volumen: 0.55,
    silencio: false,
    personaje: "tacita",
    mejoras: { vida: 0, cadencia: 0, velocidad: 0, super: 0, doble: 0, parryAuto: 0, escudo: 0, dashCargado: 0, rebote: 0, combo: 0 },
    grados: {},
    dificil: false
  };
  try {
    const raw = localStorage.getItem(CLAVE);
    if (!raw) return base;
    const data = Object.assign(base, JSON.parse(raw));
    data.mejoras = Object.assign(base.mejoras, data.mejoras || {});
    data.grados = data.grados || {};
    return data;
  } catch {
    return base;
  }
}

export function persistir() {
  localStorage.setItem(CLAVE, JSON.stringify(guardado));
}

export function claveSubnivel(mundo, sub) {
  return `${mundo}-${sub}`;
}

export function subnivelDesbloqueado(mundo, sub) {
  if (sub === 1) return true;
  return !!guardado.grados[claveSubnivel(mundo, sub - 1)];
}

export function registrarGrado(mundo, grado, sub = null) {
  const orden = { D: 1, C: 2, B: 3, A: 4, S: 5 };
  const clave = sub == null ? mundo : claveSubnivel(mundo, sub);
  const previo = guardado.grados[clave] || "D";
  if (orden[grado] >= orden[previo]) guardado.grados[clave] = grado;
  if (sub === 3) {
    const previoMundo = guardado.grados[mundo] || "D";
    if (orden[grado] >= orden[previoMundo]) guardado.grados[mundo] = grado;
  }
  guardado.dificil = [1, 2, 3, 4, 5].every(id => ["A", "S"].includes(guardado.grados[`${id}-3`]));
  persistir();
}
