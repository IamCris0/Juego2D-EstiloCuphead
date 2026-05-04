const CLAVE_LB = "panico-leaderboard-v1";
const MAX_ENTRADAS = 10;

export function obtenerLeaderboard() {
  try {
    const datos = JSON.parse(localStorage.getItem(CLAVE_LB) || "[]");
    return Array.isArray(datos) ? datos.sort((a, b) => b.puntos - a.puntos).slice(0, MAX_ENTRADAS) : [];
  } catch {
    return [];
  }
}

export function agregarPuntaje(nombre, puntos, mundo, grado) {
  const entrada = {
    nombre: (nombre || "ANONIMO").toUpperCase().slice(0, 12),
    puntos,
    mundo,
    grado,
    fecha: new Date().toLocaleDateString("es")
  };
  const tabla = obtenerLeaderboard();
  tabla.push(entrada);
  tabla.sort((a, b) => b.puntos - a.puntos);
  const posicion = tabla.indexOf(entrada) + 1;
  localStorage.setItem(CLAVE_LB, JSON.stringify(tabla.slice(0, MAX_ENTRADAS)));
  return posicion <= MAX_ENTRADAS ? posicion : null;
}

export function limpiarLeaderboard() {
  localStorage.removeItem(CLAVE_LB);
}
