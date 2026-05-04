const CLAVE_LOGROS = "panico-logros-v1";

export const DEFINICIONES_LOGROS = {
  sinRasguino: { nombre: "Sin un rasguno", badge: "dorado" },
  comboMaestro: { nombre: "Combo maestro", badge: "plateado" },
  coleccionista: { nombre: "Coleccionista", badge: "dorado" },
  parryMaestro: { nombre: "Parry maestro", badge: "dorado" },
  velocista: { nombre: "Velocista", badge: "plateado" },
  exterminador: { nombre: "Exterminador", badge: "dorado" }
};

export function cargarLogros() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_LOGROS) || '{"desbloqueados":{},"kills":0}');
  } catch {
    return { desbloqueados: {}, kills: 0 };
  }
}

export function guardarLogros(datos) {
  localStorage.setItem(CLAVE_LOGROS, JSON.stringify(datos));
}

export function desbloquearLogro(datos, id) {
  if (!DEFINICIONES_LOGROS[id] || datos.desbloqueados[id]) return null;
  datos.desbloqueados[id] = new Date().toLocaleDateString("es");
  guardarLogros(datos);
  return DEFINICIONES_LOGROS[id];
}
