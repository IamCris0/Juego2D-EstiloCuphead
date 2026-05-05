const CLAVE_STATS = "panico-stats-v1";

export const stats = cargar();

export function cargar() {
  const base = {
    totalDisparos: 0,
    totalKills: 0,
    totalMuertes: 0,
    totalParries: 0,
    tiempoTotal: 0,
    mejorCombo: 0,
    powerupsRecogidos: 0
  };
  try {
    return Object.assign(base, JSON.parse(localStorage.getItem(CLAVE_STATS) || "{}"));
  } catch {
    return base;
  }
}

export function guardar() {
  localStorage.setItem(CLAVE_STATS, JSON.stringify(stats));
}

export function actualizar(campo, valor) {
  if (campo === "mejorCombo") stats[campo] = Math.max(stats[campo] || 0, valor);
  else stats[campo] = (stats[campo] || 0) + valor;
  guardar();
}
