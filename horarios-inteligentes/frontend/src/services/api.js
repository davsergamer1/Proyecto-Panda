const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = { "Content-Type": "application/json", ...options.headers };
  const config = { ...options, headers };

  if (config.body && typeof config.body === "object") {
    config.body = JSON.stringify(config.body);
  }

  const res = await fetch(url, config);
  if (!res.ok) {
    let errMsg = `Error HTTP ${res.status}`;
    try {
      const errJson = await res.json();
      if (errJson.error) errMsg = errJson.error;
      if (errJson.detalle) errMsg += `: ${errJson.detalle}`;
    } catch (_) {}
    throw new Error(errMsg);
  }

  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  // Aulas
  getAulas: () => request("/aulas"),
  createAula: (data) => request("/aulas", { method: "POST", body: data }),
  updateAula: (id, data) => request(`/aulas/${id}`, { method: "PUT", body: data }),
  deleteAula: (id) => request(`/aulas/${id}`, { method: "DELETE" }),

  // Mallas
  getMallas: () => request("/mallas"),
  createMalla: (data) => request("/mallas", { method: "POST", body: data }),
  updateMalla: (id, data) => request(`/mallas/${id}`, { method: "PUT", body: data }),
  deleteMalla: (id) => request(`/mallas/${id}`, { method: "DELETE" }),

  // Cursos
  getCursos: () => request("/cursos"),
  createCurso: (data) => request("/cursos", { method: "POST", body: data }),
  updateCurso: (id, data) => request(`/cursos/${id}`, { method: "PUT", body: data }),
  deleteCurso: (id) => request(`/cursos/${id}`, { method: "DELETE" }),

  // Secciones
  getSecciones: () => request("/secciones"),
  createSeccion: (data) => request("/secciones", { method: "POST", body: data }),
  updateSeccion: (id, data) => request(`/secciones/${id}`, { method: "PUT", body: data }),
  deleteSeccion: (id) => request(`/secciones/${id}`, { method: "DELETE" }),

  // Catedráticos
  getCatedraticos: () => request("/catedraticos"),
  createCatedratico: (data) => request("/catedraticos", { method: "POST", body: data }),
  updateCatedratico: (id, data) => request(`/catedraticos/${id}`, { method: "PUT", body: data }),
  deleteCatedratico: (id) => request(`/catedraticos/${id}`, { method: "DELETE" }),

  // Catedráticos - Cursos (Habilitaciones)
  getCatedraticosCursos: () => request("/catedraticos-cursos"),
  createCatedraticoCurso: (data) => request("/catedraticos-cursos", { method: "POST", body: data }),
  deleteCatedraticoCurso: (id) => request(`/catedraticos-cursos/${id}`, { method: "DELETE" }),

  // Disponibilidad Horaria
  getDisponibilidad: () => request("/disponibilidad"),
  createDisponibilidad: (data) => request("/disponibilidad", { method: "POST", body: data }),
  updateDisponibilidad: (id, data) => request(`/disponibilidad/${id}`, { method: "PUT", body: data }),
  deleteDisponibilidad: (id) => request(`/disponibilidad/${id}`, { method: "DELETE" }),

  // Horarios Generados & Solver IO
  getHorarios: () => request("/horarios"),
  generarHorarios: () => request("/horarios/generar", { method: "POST" }),
  limpiarHorarios: () => request("/horarios", { method: "DELETE" }),
};
