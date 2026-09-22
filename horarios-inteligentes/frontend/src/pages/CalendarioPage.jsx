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
  Moon,
  Edit2,
  Plus,
  X,
  Clock
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

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
  const { user, isAdmin, isDocente } = useAuth();
  const [horarios, setHorarios] = useState([]);
  const [aulas, setAulas] = useState([]);
  const [catedraticos, setCatedraticos] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [runningSolver, setRunningSolver] = useState(false);
  const [solverResult, setSolverResult] = useState(null);
  const [showQuickModal, setShowQuickModal] = useState(false);

  // Filters & View Modes
  const [docenteViewMode, setDocenteViewMode] = useState("personal"); // 'personal' | 'general'
  const [filterAula, setFilterAula] = useState("");
  const [filterCat, setFilterCat] = useState("");

  // Modal de Edición / Reasignación Manual de Horario (Admin)
  const [showScheduleEditModal, setShowScheduleEditModal] = useState(false);
  const [editingScheduleItem, setEditingScheduleItem] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({
    seccion_id: "",
    catedratico_id: "",
    aula_id: "",
    dia: "Lunes",
    bloque: "07:00"
  });
  const [modalError, setModalError] = useState("");

  // Encontrar ID del catedrático autenticado
  const myCatId = user?.catedratico_id || (catedraticos.find(c => user?.nombre && c.nombre.toLowerCase().includes(user.nombre.toLowerCase().split(" ")[0]))?.id);

  const loadData = async () => {
    try {
      setLoading(true);
      const [horariosData, aulasData, catData, secData] = await Promise.all([
        api.getHorarios(),
        api.getAulas(),
        api.getCatedraticos(),
        api.getSecciones().catch(() => [])
      ]);
      setHorarios(horariosData || []);
      setAulas(aulasData || []);
      setCatedraticos(catData || []);
      setSecciones(secData || []);
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

  // Handlers Edición Manual de Horario (Admin)
  const handleOpenEditSchedule = (item) => {
    setModalError("");
    setEditingScheduleItem(item);
    setScheduleForm({
      seccion_id: item.seccion_id || (item.secciones?.id || ""),
      catedratico_id: item.catedratico_id || "",
      aula_id: item.aula_id || "",
      dia: normDia(item.dia),
      bloque: normBloque(item.bloque)
    });
    setShowScheduleEditModal(true);
  };

  const handleOpenCreateScheduleManual = (dia = "Lunes", bloque = "07:00") => {
    setModalError("");
    setEditingScheduleItem(null);
    setScheduleForm({
      seccion_id: secciones[0]?.id || "",
      catedratico_id: catedraticos[0]?.id || "",
      aula_id: aulas[0]?.id || "",
      dia: normDia(dia),
      bloque: normBloque(bloque)
    });
    setShowScheduleEditModal(true);
  };

  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    if (!scheduleForm.seccion_id || !scheduleForm.catedratico_id || !scheduleForm.aula_id) {
      setModalError("Debe seleccionar sección, catedrático y aula.");
      return;
    }
    try {
      setModalError("");
      if (editingScheduleItem) {
        await api.updateHorario(editingScheduleItem.id, scheduleForm);
      } else {
        await api.createHorario(scheduleForm);
      }
      setShowScheduleEditModal(false);
      loadData();
    } catch (err) {
      setModalError(err.message);
    }
  };

  const handleDeleteSingleSchedule = async (id) => {
    if (!window.confirm("¿Desea eliminar esta asignación de clase?")) return;
    try {
      await api.deleteHorario(id);
      setShowScheduleEditModal(false);
      loadData();
    } catch (err) {
      alert("Error al eliminar clase: " + err.message);
    }
  };

  // Filtered horarios
  const filteredHorarios = horarios.filter((h) => {
    if (isDocente && docenteViewMode === "personal") {
      if (myCatId && String(h.catedratico_id) !== String(myCatId)) return false;
    }
    if (filterAula && String(h.aula_id) !== String(filterAula)) return false;
    if (filterCat && String(h.catedratico_id) !== String(filterCat)) return false;
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

          {isDocente ? (
            <div style={{ display: "flex", gap: "0.5rem", background: "var(--table-header-bg)", padding: "4px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
              <button
                className={`btn btn-sm ${docenteViewMode === "personal" ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setDocenteViewMode("personal")}
              >
                📌 Mi Horario Personal
              </button>
              <button
                className={`btn btn-sm ${docenteViewMode === "general" ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setDocenteViewMode("general")}
              >
                🌐 Horario General y Ocupación
              </button>
            </div>
          ) : (
            <>
              <button 
                className="btn btn-secondary btn-sm" 
                onClick={() => handleOpenCreateScheduleManual()}
              >
                <Plus style={{ width: "16px" }} /> Asignación Manual
              </button>

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
            </>
          )}
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
          {isDocente && docenteViewMode === "personal" ? (
            <span style={{ color: "#10b981", fontWeight: "700" }}>📌 Modo: Mi Horario Personal</span>
          ) : (
            <span>Visibles en pantalla: <strong style={{ color: "var(--accent)" }}>{filteredHorarios.length}</strong> asignaciones</span>
          )}
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
                          borderRadius: "var(--radius-sm)",
                          position: "relative"
                        }}
                      >
                        {matches.length === 0 ? (
                          <div 
                            style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "0.72rem", opacity: 0.4, cursor: isAdmin ? "pointer" : "default" }}
                            onClick={() => isAdmin && handleOpenCreateScheduleManual(dia, bloque)}
                            title={isAdmin ? "Hacer clic para asignar un horario aquí" : "Slot Libre"}
                          >
                            <span>🟢 Libre</span>
                            {isAdmin && <span style={{ fontSize: "0.65rem", marginTop: "2px" }}>+ Asignar</span>}
                          </div>
                        ) : (
                          matches.map((item) => {
                            const courseName = item.secciones?.cursos?.nombre || "Curso";
                            const catName = item.catedraticos?.nombre || "Catedrático";
                            const aulaName = item.aulas?.nombre || "Aula";
                            const color = getCourseColor(courseName);
                            const tieneCanonera = item.aulas?.tiene_canonera;
                            const tieneEscritorio = item.aulas?.tiene_escritorio;
                            const esMiClase = isDocente && myCatId && String(item.catedratico_id) === String(myCatId);

                            return (
                              <div 
                                key={item.id} 
                                style={{
                                  background: esMiClase ? "rgba(16, 185, 129, 0.18)" : color.bg,
                                  borderLeft: esMiClase ? "4px solid #10b981" : `4px solid ${color.border}`,
                                  borderRadius: "6px",
                                  padding: "6px 8px",
                                  marginBottom: "4px",
                                  fontSize: "0.75rem",
                                  boxShadow: esMiClase ? "0 2px 10px rgba(16, 185, 129, 0.3)" : "0 2px 8px rgba(0,0,0,0.2)",
                                  position: "relative"
                                }}
                              >
                                <div style={{ fontWeight: "700", color: esMiClase ? "#10b981" : color.text, marginBottom: "2px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                  <span>{courseName} {esMiClase && "⭐"}</span>
                                  <div style={{ display: "flex", gap: "3px", alignItems: "center", fontSize: "0.7rem" }}>
                                    {tieneCanonera && <span title="Aula con Proyector / Cañonera">📹</span>}
                                    {tieneEscritorio && <span title="Aula con Escritorio">🪑</span>}
                                    {isAdmin && (
                                      <Edit2
                                        style={{ width: "12px", cursor: "pointer", marginLeft: "4px", color: "var(--primary)" }}
                                        onClick={(e) => { e.stopPropagation(); handleOpenEditSchedule(item); }}
                                        title="Reasignar o Cambiar Horario de esta clase"
                                      />
                                    )}
                                  </div>
                                </div>
                                <div style={{ color: "var(--text-main)", opacity: 0.9, fontSize: "0.72rem" }}>
                                  👨‍🏫 {catName} {esMiClase ? "(Tú)" : ""}
                                </div>
                                <div style={{ color: "var(--text-muted)", fontSize: "0.7rem", marginTop: "2px", display: "flex", justifyContent: "space-between" }}>
                                  <span>🏫 {aulaName}</span>
                                  <span style={{ fontSize: "0.68rem", fontWeight: "700", color: esMiClase ? "#10b981" : "var(--danger)" }}>
                                    {esMiClase ? "Tu Clase" : "🔴 Ocupado"}
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Reasignar / Editar Horario Manualmente (Admin) */}
      {showScheduleEditModal && isAdmin && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ maxWidth: "460px" }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Clock style={{ width: "20px", color: "var(--primary)" }} />
                {editingScheduleItem ? "Reasignar / Cambiar Horario de Docente" : "Nueva Asignación Manual de Horario"}
              </h3>
              <button onClick={() => setShowScheduleEditModal(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
                <X style={{ width: "20px" }} />
              </button>
            </div>
            <form onSubmit={handleSaveSchedule}>
              <div className="modal-body">
                {modalError && (
                  <div style={{ padding: "0.65rem 0.85rem", borderRadius: "var(--radius-sm)", background: "rgba(220, 38, 38, 0.12)", color: "var(--danger)", fontSize: "0.82rem", marginBottom: "0.85rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <AlertTriangle style={{ width: "16px" }} /> {modalError}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Sección / Curso</label>
                  <select
                    className="form-select"
                    value={scheduleForm.seccion_id}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, seccion_id: e.target.value })}
                    required
                  >
                    <option value="">-- Seleccionar Sección / Curso --</option>
                    {secciones.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.cursos?.nombre || "Curso"} (Sección ID: {s.id.substring(0,6)}...)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Catedrático Asignado</label>
                  <select
                    className="form-select"
                    value={scheduleForm.catedratico_id}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, catedratico_id: e.target.value })}
                    required
                  >
                    <option value="">-- Seleccionar Catedrático --</option>
                    {catedraticos.map((c) => (
                      <option key={c.id} value={c.id}>
                        👨‍🏫 {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Aula de Clase</label>
                  <select
                    className="form-select"
                    value={scheduleForm.aula_id}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, aula_id: e.target.value })}
                    required
                  >
                    <option value="">-- Seleccionar Aula --</option>
                    {aulas.map((a) => (
                      <option key={a.id} value={a.id}>
                        🏫 {a.nombre} (Capacidad: {a.capacidad})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div className="form-group">
                    <label className="form-label">Día de la Semana</label>
                    <select
                      className="form-select"
                      value={scheduleForm.dia}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, dia: e.target.value })}
                    >
                      {DIAS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Bloque Horario</label>
                    <select
                      className="form-select"
                      value={scheduleForm.bloque}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, bloque: e.target.value })}
                    >
                      {BLOQUES.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer" style={{ justifyContent: "space-between" }}>
                {editingScheduleItem ? (
                  <button 
                    type="button" 
                    className="btn btn-danger btn-sm" 
                    onClick={() => handleDeleteSingleSchedule(editingScheduleItem.id)}
                  >
                    <Trash2 style={{ width: "14px" }} /> Eliminar Clase
                  </button>
                ) : <div />}

                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowScheduleEditModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary">
                    <CheckCircle2 style={{ width: "16px" }} /> Guardar Asignación
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

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

