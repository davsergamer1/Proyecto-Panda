import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import QuickCreateModal from "../components/QuickCreateModal";
import { 
  Play, 
  Trash2, 
  Filter, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw,
  Building2,
  Users,
  BookOpen,
  Zap,
  Sun,
  Moon
} from "lucide-react";

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const BLOQUES = [
  "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
  "17:00", "18:00", "19:00", "20:00"
];

const normDia = (d) => {
  if (!d) return "";
  const upper = d.toUpperCase().trim();
  if (upper.startsWith("LUN")) return "Lunes";
  if (upper.startsWith("MAR")) return "Martes";
  if (upper.startsWith("MIE")) return "Miércoles";
  if (upper.startsWith("JUE")) return "Jueves";
  if (upper.startsWith("VIE")) return "Viernes";
  if (upper.startsWith("SAB")) return "Sábado";
  return d;
};

const normBloque = (b) => {
  if (!b) return "";
  const str = String(b).trim();
  if (str.length <= 2) return str.padStart(2, "0") + ":00";
  if (str.includes(":")) return str.substring(0, 5);
  return str;
};

// Generador de colores de cursos adaptables a Modo Claro y Modo Oscuro
const COLORS = [
  { bg: "rgba(29, 78, 216, 0.12)", border: "#2563eb", text: "var(--text-main)" },
  { bg: "rgba(217, 119, 6, 0.12)", border: "#d97706", text: "var(--text-main)" },
  { bg: "rgba(5, 150, 105, 0.12)", border: "#059669", text: "var(--text-main)" },
  { bg: "rgba(147, 51, 234, 0.12)", border: "#9333ea", text: "var(--text-main)" },
  { bg: "rgba(225, 29, 72, 0.12)", border: "#e11d48", text: "var(--text-main)" },
  { bg: "rgba(14, 165, 233, 0.12)", border: "#0284c7", text: "var(--text-main)" },
];

export default function CalendarioPage({ theme, toggleTheme }) {
  const [horarios, setHorarios] = useState([]);
  const [aulas, setAulas] = useState([]);
  const [catedraticos, setCatedraticos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [runningSolver, setRunningSolver] = useState(false);
  const [solverResult, setSolverResult] = useState(null);
  const [showQuickModal, setShowQuickModal] = useState(false);

  // Filters
  const [filterAula, setFilterAula] = useState("");
  const [filterCat, setFilterCat] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [horariosData, aulasData, catData] = await Promise.all([
        api.getHorarios(),
        api.getAulas(),
        api.getCatedraticos()
      ]);
      setHorarios(horariosData || []);
      setAulas(aulasData || []);
      setCatedraticos(catData || []);
    } catch (err) {
      console.error("Error al cargar horarios:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRunOptimizer = async () => {
    try {
      setRunningSolver(true);
      setSolverResult(null);
      const res = await api.generarHorarios();
      setSolverResult(res);
      await loadData();
    } catch (err) {
      setSolverResult({ exito: false, error: err.message });
    } finally {
      setRunningSolver(false);
    }
  };

  const handleClearSchedule = async () => {
    if (!window.confirm("¿Está seguro de borrar el horario generado actual?")) return;
    try {
      await api.limpiarHorarios();
      setSolverResult(null);
      loadData();
    } catch (err) {
      alert("Error al borrar horario: " + err.message);
    }
  };

  // Filtered horarios
  const filteredHorarios = horarios.filter((h) => {
    if (filterAula && h.aula_id !== filterAula) return false;
    if (filterCat && h.catedratico_id !== filterCat) return false;
    return true;
  });

  // Assign color to course ID deterministically
  const getCourseColor = (courseName) => {
    if (!courseName) return COLORS[0];
    let hash = 0;
    for (let i = 0; i < courseName.length; i++) {
      hash = courseName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % COLORS.length;
    return COLORS[idx];
  };

  return (
    <div className="page-container" style={{ padding: "2rem", width: "100%" }}>
      {/* Header & Main Action Controls */}
      <div className="header-responsive">
        <div>
          <h1 style={{ fontSize: "1.75rem", margin: 0, display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
            <CalendarIcon style={{ color: "var(--primary)" }} />
            Calendario Académico e Inteligencia de Operaciones
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Optimización matemática de horarios universitarios en tiempo real (Modelo MILP en PuLP).
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
          {toggleTheme && (
            <button
              onClick={toggleTheme}
              className="theme-toggle-btn"
              title="Cambiar Modo Claro / Oscuro"
              style={{ padding: "0.6rem 1rem" }}
            >
              {theme === "dark" ? <Sun style={{ width: "18px", color: "#f59e0b" }} /> : <Moon style={{ width: "18px", color: "#2563eb" }} />}
              <span>{theme === "dark" ? "Modo Claro" : "Modo Oscuro"}</span>
            </button>
          )}

          <button 
            className="btn btn-accent" 
            onClick={() => setShowQuickModal(true)}
            style={{ padding: "0.6rem 1.25rem", fontSize: "0.95rem" }}
          >
            <Zap style={{ width: "18px" }} /> ⚡ Creación Rápida
          </button>

          <button 
            className="btn btn-secondary" 
            onClick={handleClearSchedule}
            disabled={runningSolver}
          >
            <Trash2 style={{ width: "18px" }} /> Limpiar Horario
          </button>
          
          <button 
            className="btn btn-primary" 
            onClick={handleRunOptimizer}
            disabled={runningSolver}
            style={{ padding: "0.6rem 1.5rem", fontSize: "0.95rem" }}
          >
            {runningSolver ? (
              <>
                <RefreshCw className="spin" style={{ width: "18px", animation: "spin 1s linear infinite" }} />
                Ejecutando Modelo PuLP...
              </>
            ) : (
              <>
                <Play style={{ width: "18px", fill: "currentColor" }} />
                Ejecutar Optimización I.O.
              </>
            )}
          </button>
        </div>
      </div>

      {/* KPI Stat Cards Dashboard */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon-box kpi-icon-indigo">
            <BookOpen style={{ width: "24px" }} />
          </div>
          <div>
            <div className="kpi-label">Asignaciones Generadas</div>
            <div className="kpi-value">{horarios.length}</div>
            <div className="kpi-subtext">Bloques de clase programados</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-box kpi-icon-cyan">
            <Building2 style={{ width: "24px" }} />
          </div>
          <div>
            <div className="kpi-label">Aulas en Uso</div>
            <div className="kpi-value">
              {new Set(horarios.map(h => h.aula_id)).size} / {aulas.length}
            </div>
            <div className="kpi-subtext">Capacidad de infraestructura activa</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-box kpi-icon-emerald">
            <Users style={{ width: "24px" }} />
          </div>
          <div>
            <div className="kpi-label">Catedráticos Asignados</div>
            <div className="kpi-value">
              {new Set(horarios.map(h => h.catedratico_id)).size}
            </div>
            <div className="kpi-subtext">Profesores con carga horaria</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-box kpi-icon-amber">
            <span className="pulse-dot pulse-dot-green"></span>
          </div>
          <div>
            <div className="kpi-label">Estado del Solucionador</div>
            <div className="kpi-value" style={{ fontSize: "1.2rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              {horarios.length > 0 ? "Óptima (PuLP CBC)" : "Sin Solución"}
            </div>
            <div className="kpi-subtext">Programación Entera Mixta (MILP)</div>
          </div>
        </div>
      </div>

      {/* Solver Notification Banner */}
      {solverResult && (
        <div className="animate-fade-in" style={{
          padding: "1rem 1.25rem",
          borderRadius: "var(--radius-md)",
          marginBottom: "1.5rem",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          background: solverResult.exito ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
          border: solverResult.exito ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid rgba(239, 68, 68, 0.4)",
          color: solverResult.exito ? "#6ee7b7" : "#fca5a5"
        }}>
          {solverResult.exito ? (
            <CheckCircle2 style={{ width: "24px", height: "24px", flexShrink: 0 }} />
          ) : (
            <AlertTriangle style={{ width: "24px", height: "24px", flexShrink: 0 }} />
          )}
          <div>
            <h4 style={{ margin: 0, fontSize: "1rem", color: solverResult.exito ? "#6ee7b7" : "#fca5a5" }}>
              {solverResult.exito ? "¡Optimización Exitosa!" : "No se Pudo Resolver la Optimización"}
            </h4>
            <p style={{ margin: "0.2rem 0 0", fontSize: "0.85rem", opacity: 0.9 }}>
              {solverResult.exito
                ? "El modelo matemático MILP encontró una solución óptima cumpliendo restricciones de aulas, disponibilidad docente y horas de curso."
                : (solverResult.error || "Ocurrió un error al procesar las restricciones.")}
            </p>
            {!solverResult.exito && (solverResult.detalle || solverResult.salida) && (
              <details style={{ marginTop: "0.5rem", fontSize: "0.8rem", cursor: "pointer", opacity: 0.95 }}>
                <summary>Ver diagnóstico detallado de la optimización...</summary>
                <pre style={{ marginTop: "0.4rem", whiteSpace: "pre-wrap", fontFamily: "monospace", background: "rgba(0,0,0,0.4)", padding: "0.6rem", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.1)", color: "#fca5a5" }}>
                  {solverResult.detalle || solverResult.salida}
                </pre>
              </details>
            )}
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="glass-panel filters-bar-responsive" style={{ padding: "1rem 1.5rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-muted)" }}>
          <Filter style={{ width: "18px" }} />
          <span style={{ fontWeight: "600", fontSize: "0.9rem" }}>Filtros de Vista:</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          <Building2 style={{ width: "16px", color: "var(--accent)" }} />
          <select 
            className="form-select" 
            style={{ minWidth: "180px" }}
            value={filterAula}
            onChange={(e) => setFilterAula(e.target.value)}
          >
            <option value="">-- Todas las Aulas --</option>
            {aulas.map((a) => (
              <option key={a.id} value={a.id}>{a.nombre} (Cap. {a.capacidad})</option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          <Users style={{ width: "16px", color: "var(--primary)" }} />
          <select 
            className="form-select" 
            style={{ minWidth: "200px" }}
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
          >
            <option value="">-- Todos los Catedráticos --</option>
            {catedraticos.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>

        {(filterAula || filterCat) && (
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={() => { setFilterAula(""); setFilterCat(""); }}
          >
            Limpiar Filtros
          </button>
        )}

        <div style={{ marginLeft: "auto", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "500" }}>
          Visibles en pantalla: <strong style={{ color: "var(--accent)" }}>{filteredHorarios.length}</strong> asignaciones
        </div>
      </div>

      {/* Interactive Calendar Grid */}
      <div className="glass-panel table-container" style={{ padding: "1.5rem" }}>
        {loading ? (
          <div style={{ padding: "4rem", textAlign: "center", color: "var(--text-muted)" }}>
            Cargando calendario interactivo...
          </div>
        ) : (
          <table className="custom-table" style={{ borderCollapse: "separate", borderSpacing: "8px", background: "transparent" }}>
            <thead>
              <tr>
                <th style={{ width: "100px", textAlign: "center" }}>Horario</th>
                {DIAS.map((dia) => (
                  <th key={dia} style={{ textAlign: "center", fontSize: "0.9rem" }}>{dia}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {BLOQUES.map((bloque) => (
                <tr key={bloque}>
                  <td style={{ textAlign: "center", fontWeight: "700", background: "var(--table-header-bg)", borderRadius: "var(--radius-sm)", color: "var(--text-muted)", border: "1px solid var(--border-color)" }}>
                    {bloque}
                  </td>

                  {DIAS.map((dia) => {
                    // Get all assignments for this day and block
                    const matches = filteredHorarios.filter(
                      (h) => normDia(h.dia) === normDia(dia) && normBloque(h.bloque) === normBloque(bloque)
                    );

                    return (
                      <td 
                        key={dia} 
                        style={{ 
                          height: "90px", 
                          verticalAlign: "top", 
                          padding: "6px",
                          background: matches.length > 0 ? "var(--bg-card-hover)" : "var(--bg-card)",
                          border: "1px solid var(--border-color)",
                          borderRadius: "var(--radius-sm)"
                        }}
                      >
                        {matches.map((item) => {
                          const courseName = item.secciones?.cursos?.nombre || "Curso";
                          const catName = item.catedraticos?.nombre || "Catedrático";
                          const aulaName = item.aulas?.nombre || "Aula";
                          const color = getCourseColor(courseName);
                          const tieneCanonera = item.aulas?.tiene_canonera;
                          const tieneEscritorio = item.aulas?.tiene_escritorio;

                          return (
                            <div 
                              key={item.id} 
                              style={{
                                background: color.bg,
                                borderLeft: `4px solid ${color.border}`,
                                borderRadius: "6px",
                                padding: "6px 8px",
                                marginBottom: "4px",
                                fontSize: "0.75rem",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
                              }}
                            >
                              <div style={{ fontWeight: "700", color: color.text, marginBottom: "2px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span>{courseName}</span>
                                <div style={{ display: "flex", gap: "3px", fontSize: "0.7rem" }}>
                                  {tieneCanonera && <span title="Aula con Proyector / Cañonera">📹</span>}
                                  {tieneEscritorio && <span title="Aula con Escritorio">🪑</span>}
                                </div>
                              </div>
                              <div style={{ color: "var(--text-main)", opacity: 0.9 }}>
                                👨‍🏫 {catName}
                              </div>
                              <div style={{ color: "var(--text-muted)", fontSize: "0.7rem", marginTop: "2px" }}>
                                🏫 {aulaName}
                              </div>
                            </div>
                          );
                        })}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Quick Express Creator Modal */}
      <QuickCreateModal 
        isOpen={showQuickModal} 
        onClose={() => setShowQuickModal(false)} 
        onSuccess={loadData} 
      />

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
