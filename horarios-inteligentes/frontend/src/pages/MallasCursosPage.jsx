import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { BookOpen, Layers, Plus, Edit2, Trash2, Check, X } from "lucide-react";

export default function MallasCursosPage() {
  const { isAdmin } = useAuth();
  const [activeSubtab, setActiveSubtab] = useState("cursos");
  const [mallas, setMallas] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal Malla State
  const [showMallaModal, setShowMallaModal] = useState(false);
  const [editingMalla, setEditingMalla] = useState(null);
  const [mallaForm, setMallaForm] = useState({ nombre: "", semestre: 1 });

  // Modal Curso State
  const [showCursoModal, setShowCursoModal] = useState(false);
  const [editingCurso, setEditingCurso] = useState(null);
  const [cursoForm, setCursoForm] = useState({
    malla_id: "",
    nombre: "",
    horas_semana: 2,
    requiere_canonera: false,
    requiere_escritorio: false,
    requiere_pizarra: true
  });

  const [errorMsg, setErrorMsg] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [mallasData, cursosData] = await Promise.all([
        api.getMallas(),
        api.getCursos()
      ]);
      setMallas(mallasData || []);
      setCursos(cursosData || []);
    } catch (err) {
      setErrorMsg("Error al cargar datos: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handlers Mallas
  const handleOpenCreateMalla = () => {
    setEditingMalla(null);
    setMallaForm({ nombre: "", semestre: 1 });
    setErrorMsg("");
    setShowMallaModal(true);
  };

  const handleOpenEditMalla = (m) => {
    setEditingMalla(m);
    setMallaForm({ nombre: m.nombre, semestre: m.semestre || 1 });
    setErrorMsg("");
    setShowMallaModal(true);
  };

  const handleSaveMalla = async (e) => {
    e.preventDefault();
    if (!mallaForm.nombre.trim()) {
      setErrorMsg("El nombre de la malla es obligatorio");
      return;
    }
    try {
      if (editingMalla) {
        await api.updateMalla(editingMalla.id, mallaForm);
      } else {
        await api.createMalla(mallaForm);
      }
      setShowMallaModal(false);
      loadData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleDeleteMalla = async (id) => {
    if (!window.confirm("¿Desea eliminar esta malla curricular?")) return;
    try {
      await api.deleteMalla(id);
      loadData();
    } catch (err) {
      alert("Error al eliminar malla: " + err.message);
    }
  };

  // Handlers Cursos
  const handleOpenCreateCurso = () => {
    setEditingCurso(null);
    setCursoForm({
      malla_id: mallas.length > 0 ? mallas[0].id : "",
      nombre: "",
      horas_semana: 2
    });
    setErrorMsg("");
    setShowCursoModal(true);
  };

  const handleOpenEditCurso = (c) => {
    setEditingCurso(c);
    setCursoForm({
      malla_id: c.malla_id,
      nombre: c.nombre,
      horas_semana: c.horas_semana
    });
    setErrorMsg("");
    setShowCursoModal(true);
  };

  const handleSaveCurso = async (e) => {
    e.preventDefault();
    if (!cursoForm.nombre.trim()) {
      setErrorMsg("El nombre del curso es obligatorio");
      return;
    }
    if (!cursoForm.malla_id) {
      setErrorMsg("Seleccione una malla o semestre");
      return;
    }
    try {
      if (editingCurso) {
        await api.updateCurso(editingCurso.id, cursoForm);
      } else {
        await api.createCurso(cursoForm);
      }
      setShowCursoModal(false);
      loadData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleDeleteCurso = async (id) => {
    if (!window.confirm("¿Desea eliminar este curso?")) return;
    try {
      await api.deleteCurso(id);
      loadData();
    } catch (err) {
      alert("Error al eliminar curso: " + err.message);
    }
  };

  return (
    <div className="page-container">
      {/* Header Bar */}
      <div className="header-responsive" style={{ marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", margin: 0 }}>Red Académica (Mallas y Cursos)</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Definición de mallas curriculares, semestres y asignación de horas semanales.
          </p>
        </div>
        {isAdmin && (
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            {activeSubtab === "mallas" ? (
              <button className="btn btn-primary" onClick={handleOpenCreateMalla}>
                <Plus style={{ width: "18px" }} /> Nueva Malla / Semestre
              </button>
            ) : (
              <button className="btn btn-primary" onClick={handleOpenCreateCurso}>
                <Plus style={{ width: "18px" }} /> Nuevo Curso
              </button>
            )}
          </div>
        )}
      </div>

      {/* KPI Summary Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon-box kpi-icon-indigo">
            <BookOpen style={{ width: "24px" }} />
          </div>
          <div>
            <div className="kpi-label">Catálogo de Cursos</div>
            <div className="kpi-value">{cursos.length}</div>
            <div className="kpi-subtext">Asignaturas registradas</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-box kpi-icon-cyan">
            <Layers style={{ width: "24px" }} />
          </div>
          <div>
            <div className="kpi-label">Mallas / Semestres</div>
            <div className="kpi-value">{mallas.length}</div>
            <div className="kpi-subtext">Ciclos académicos activos</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-box kpi-icon-emerald">
            <BookOpen style={{ width: "24px" }} />
          </div>
          <div>
            <div className="kpi-label">Horas Semanales Totales</div>
            <div className="kpi-value">
              {cursos.reduce((sum, c) => sum + (c.horas_semana || 0), 0)} h
            </div>
            <div className="kpi-subtext">Carga de periodos a impartir</div>
          </div>
        </div>
      </div>

      {/* Tabs selector */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.5rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>
        <button
          className="btn"
          style={{
            background: activeSubtab === "cursos" ? "var(--primary)" : "transparent",
            color: activeSubtab === "cursos" ? "#fff" : "var(--text-muted)",
            border: "none"
          }}
          onClick={() => setActiveSubtab("cursos")}
        >
          <BookOpen style={{ width: "16px" }} /> Cursos ({cursos.length})
        </button>
        <button
          className="btn"
          style={{
            background: activeSubtab === "mallas" ? "var(--primary)" : "transparent",
            color: activeSubtab === "mallas" ? "#fff" : "var(--text-muted)",
            border: "none"
          }}
          onClick={() => setActiveSubtab("mallas")}
        >
          <Layers style={{ width: "16px" }} /> Mallas / Semestres ({mallas.length})
        </button>
      </div>

      {/* Tab 1: Cursos */}
      {activeSubtab === "cursos" && (
        <div className="glass-panel" style={{ padding: "1rem" }}>
          {loading ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
              Cargando catálogo de cursos...
            </div>
          ) : cursos.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
              No hay cursos registrados. Registre mallas primero y agregue cursos.
            </div>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Nombre del Curso</th>
                    <th>Malla / Semestre</th>
                    <th>Horas Semanales</th>
                    {isAdmin && <th style={{ textAlign: "right" }}>Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {cursos.map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: "600" }}>{c.nombre}</td>
                      <td>
                        <span className="badge badge-primary">
                          {c.mallas?.nombre || "Sin Malla"}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-warning">
                          {c.horas_semana} periodos/semana
                        </span>
                      </td>
                      {isAdmin && (
                        <td style={{ textAlign: "right" }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => handleOpenEditCurso(c)} style={{ marginRight: "0.5rem" }}>
                            <Edit2 style={{ width: "14px" }} /> Editar
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeleteCurso(c.id)}>
                            <Trash2 style={{ width: "14px" }} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Mallas */}
      {activeSubtab === "mallas" && (
        <div className="glass-panel" style={{ padding: "1rem" }}>
          {loading ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
              Cargando mallas curriculares...
            </div>
          ) : mallas.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
              No hay mallas registradas.
            </div>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Nombre de la Malla / Carrera</th>
                    <th>Semestre</th>
                    {isAdmin && <th style={{ textAlign: "right" }}>Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {mallas.map((m) => (
                    <tr key={m.id}>
                      <td style={{ fontWeight: "600" }}>{m.nombre}</td>
                      <td>
                        <span className="badge badge-primary">
                          Semestre {m.semestre || 1}
                        </span>
                      </td>
                      {isAdmin && (
                        <td style={{ textAlign: "right" }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => handleOpenEditMalla(m)} style={{ marginRight: "0.5rem" }}>
                            <Edit2 style={{ width: "14px" }} /> Editar
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeleteMalla(m.id)}>
                            <Trash2 style={{ width: "14px" }} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal Malla */}
      {showMallaModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>{editingMalla ? "Editar Malla" : "Nueva Malla Curricular"}</h3>
              <button onClick={() => setShowMallaModal(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
                <X style={{ width: "20px" }} />
              </button>
            </div>
            <form onSubmit={handleSaveMalla}>
              <div className="modal-body">
                {errorMsg && <div style={{ color: "#fca5a5", marginBottom: "1rem" }}>{errorMsg}</div>}
                <div className="form-group">
                  <label className="form-label">Nombre / Descripción de Malla</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej. Semestre 1 - Ing. Sistemas"
                    value={mallaForm.nombre}
                    onChange={(e) => setMallaForm({ ...mallaForm, nombre: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Semestre / Ciclo</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    value={mallaForm.semestre}
                    onChange={(e) => setMallaForm({ ...mallaForm, semestre: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowMallaModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Curso */}
      {showCursoModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>{editingCurso ? "Editar Curso" : "Nuevo Curso"}</h3>
              <button onClick={() => setShowCursoModal(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
                <X style={{ width: "20px" }} />
              </button>
            </div>
            <form onSubmit={handleSaveCurso}>
              <div className="modal-body">
                {errorMsg && <div style={{ color: "#fca5a5", marginBottom: "1rem" }}>{errorMsg}</div>}
                <div className="form-group">
                  <label className="form-label">Nombre del Curso</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej. Investigación de Operaciones, Cálculo I"
                    value={cursoForm.nombre}
                    onChange={(e) => setCursoForm({ ...cursoForm, nombre: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Malla Curricular / Semestre</label>
                  <select
                    className="form-select"
                    value={cursoForm.malla_id}
                    onChange={(e) => setCursoForm({ ...cursoForm, malla_id: e.target.value })}
                  >
                    <option value="">-- Seleccionar Malla --</option>
                    {mallas.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nombre} (Semestre {m.semestre})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Horas Semanales Requeridas (Periodos)</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    value={cursoForm.horas_semana}
                    onChange={(e) => setCursoForm({ ...cursoForm, horas_semana: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCursoModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
