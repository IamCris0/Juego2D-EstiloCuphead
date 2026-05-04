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
    mejoras: { vida: 0, cadencia: 0, velocidad: 0, super: 0 },
    grados: {},
    dificil: false
  };
  try {
    const raw = localStorage.getItem(CLAVE);
    return raw ? Object.assign(base, JSON.parse(raw)) : base;
  } catch {
    return base;
  }
}

export function persistir() {
  localStorage.setItem(CLAVE, JSON.stringify(guardado));
}

export function registrarGrado(mundo, grado) {
  const orden = { D: 1, C: 2, B: 3, A: 4, S: 5 };
  const previo = guardado.grados[mundo] || "D";
  if (orden[grado] >= orden[previo]) guardado.grados[mundo] = grado;
  guardado.dificil = [1, 2, 3, 4, 5].every(id => ["A", "S"].includes(guardado.grados[id]));
  persistir();
}
