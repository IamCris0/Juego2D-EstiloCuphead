const SUPABASE_URL = "https://yjsmszjapelqhydbrnpx.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlqc21zemphcGVscWh5ZGJybnB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MzgyNTUsImV4cCI6MjA5MzUxNDI1NX0.4cStKpbmnqiiKm8V4AsEBfObroxAN4hm1ZQgm069kfU";

export const leaderboardOnline = {
  url: SUPABASE_URL,
  key: SUPABASE_KEY,
  disponible: false,

  async verificar() {
    if (this.url.includes("TU_PROYECTO") || this.key.includes("TU_ANON")) {
      this.disponible = false;
      return false;
    }
    try {
      const r = await fetch(`${this.url}/rest/v1/puntajes?limit=1`, {
        headers: { apikey: this.key, Authorization: `Bearer ${this.key}` }
      });
      this.disponible = r.ok;
    } catch {
      this.disponible = false;
    }
    return this.disponible;
  },

  async obtenerHoy() {
    const hoy = new Date().toISOString().split("T")[0];
    try {
      const r = await fetch(
        `${this.url}/rest/v1/puntajes?fecha=eq.${hoy}&order=puntos.desc&limit=10`,
        { headers: { apikey: this.key, Authorization: `Bearer ${this.key}` } }
      );
      return r.ok ? await r.json() : [];
    } catch {
      return [];
    }
  },

  async obtenerGlobal() {
    try {
      const r = await fetch(
        `${this.url}/rest/v1/puntajes?order=puntos.desc&limit=10`,
        { headers: { apikey: this.key, Authorization: `Bearer ${this.key}` } }
      );
      return r.ok ? await r.json() : [];
    } catch {
      return [];
    }
  },

  async insertar(nombre, puntos, mundo, grado) {
    if (!this.disponible) return null;
    const hoy = new Date().toISOString().split("T")[0];
    try {
      const r = await fetch(`${this.url}/rest/v1/puntajes`, {
        method: "POST",
        headers: {
          apikey: this.key,
          Authorization: `Bearer ${this.key}`,
          "Content-Type": "application/json",
          Prefer: "return=representation"
        },
        body: JSON.stringify({ nombre, puntos, mundo, grado, fecha: hoy })
      });
      if (!r.ok) return null;
      const data = await r.json();
      const tabla = await this.obtenerHoy();
      return tabla.findIndex(e => e.id === data[0]?.id) + 1 || null;
    } catch {
      return null;
    }
  }
};
