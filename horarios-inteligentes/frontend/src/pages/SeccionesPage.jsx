import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { Layers, Plus, Edit2, Trash2, X, Users, BookOpen } from "lucide-react";

export default function SeccionesPage() {
  const [secciones, setSecciones] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSeccion, setEditingSeccion] = useState(null);
  const [formData, setFormData] = useState({
    curso_id: "",
    cupo: 25
  });
  const [errorMsg, setErrorMsg] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [seccionesData, cursosData] = await Promise.all([
        api.getSecciones(),
        api.getCursos()
      ]);
      setSecciones(seccionesData || []);
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

  const handleOpenCreate = () => {
    setEditingSeccion(null);
    setFormData({
      curso_id: cursos.length > 0 ? cursos[0].id : "",
      cupo: 25
    });
    setErrorMsg("");
    setShowModal(true);
  };

  const handleOpenEdit = (s) => {
    setEditingSeccion(s);
    setFormData({
      curso_id: s.curso_id,
      cupo: s.cupo
    });
    setErrorMsg("");
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.curso_id) {
      setErrorMsg("Seleccione un curso para la sección");
      return;
    }
    try {
      if (editingSeccion) {
        await api.updateSeccion(editingSeccion.id, formData);
      } else {
        await api.createSeccion(formData);
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Desea eliminar esta sección de curso?")) return;
    try {
      await api.deleteSeccion(id);
      loadData();
    } catch (err) {
      alert("Error al eliminar sección: " + err.message);
    }
  };

  return (
    <div className="page-container">
      {/* Header Bar */}
      <div className="header-responsive" style={{ marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", margin: 0 }}>Secciones Abiertas</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Apertura de secciones por curso y definición de cupos de estudiantes inscritos.
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <Plus style={{ width: "18px" }} /> Abrir Nueva Sección
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon-box kpi-icon-indigo">
            <Layers style={{ width: "24px" }} />
          </div>
          <div>
            <div className="kpi-label">Secciones Habilitadas</div>
            <div className="kpi-value">{secciones.length}</div>
            <div className="kpi-subtext">Grupos de alumnos activos</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-box kpi-icon-cyan">
            <Users style={{ width: "24px" }} />
          </div>
          <div>
            <div className="kpi-label">Cupo Total Estimado</div>
            <div className="kpi-value">
              {secciones.reduce((sum, s) => sum + (s.cupo || 0), 0)}
            </div>
            <div className="kpi-subtext">Estudiantes a ubicar en aulas</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-box kpi-icon-emerald">
            <BookOpen style={{ width: "24px" }} />
          </div>
          <div>
            <div className="kpi-label">Promedio Alumnos/Sección</div>
            <div className="kpi-value">
              {secciones.length > 0 
                ? Math.round(secciones.reduce((sum, s) => sum + (s.cupo || 0), 0) / secciones.length) 
                : 0}
            </div>
            <div className="kpi-subtext">Densidad por salón</div>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="glass-panel" style={{ padding: "1rem" }}>
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
            Cargando secciones abiertas...
          </div>
        ) : secciones.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
            No hay secciones registradas.
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>ID Sección</th>
                  <th>Curso Asociado</th>
                  <th>Cupo Estimado de Alumnos</th>
                  <th style={{ textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {secciones.map((sec, idx) => (
                  <tr key={sec.id}>
                    <td>
                      <span className="badge badge-primary">
                        Sección #{idx + 1}
                      </span>
                    </td>
                    <td style={{ fontWeight: "600" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <BookOpen style={{ width: "16px", color: "var(--accent)" }} />
                        {sec.cursos?.nombre || "Curso no encontrado"}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <Users style={{ width: "16px", color: "var(--success)" }} />
                        <span style={{ fontWeight: "600" }}>{sec.cupo}</span> estudiantes
                      </div>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleOpenEdit(sec)} style={{ marginRight: "0.5rem" }}>
                        <Edit2 style={{ width: "14px" }} /> Editar
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(sec.id)}>
                        <Trash2 style={{ width: "14px" }} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Dialog */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>{editingSeccion ? "Editar Sección" : "Nueva Sección Abierta"}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
                <X style={{ width: "20px" }} />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                {errorMsg && <div style={{ color: "#fca5a5", marginBottom: "1rem" }}>{errorMsg}</div>}
                
                <div className="form-group">
                  <label className="form-label">Curso</label>
                  <select
                    className="form-select"
                    value={formData.curso_id}
                    onChange={(e) => setFormData({ ...formData, curso_id: e.target.value })}
                  >
                    <option value="">-- Seleccionar Curso --</option>
                    {cursos.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} ({c.horas_semana}h/sem)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Cupo de Estudiantes Inscritos</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    value={formData.cupo}
                    onChange={(e) => setFormData({ ...formData, cupo: parseInt(e.target.value) || 0 })}
                  />
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                    El aula asignada por el optimizador deberá tener una capacidad igual o mayor a este cupo.
                  </span>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
