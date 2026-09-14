import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { Building2, Plus, Edit2, Trash2, Check, X, Search } from "lucide-react";

export default function AulasPage() {
  const [aulas, setAulas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingAula, setEditingAula] = useState(null);
  const [formData, setFormData] = useState({
    nombre: "",
    capacidad: 30,
    tiene_canonera: true,
    tiene_escritorio: true,
    tiene_pizarra: true
  });
  const [errorMsg, setErrorMsg] = useState("");

  const loadAulas = async () => {
    try {
      setLoading(true);
      const data = await api.getAulas();
      setAulas(data || []);
    } catch (err) {
      setErrorMsg("Error al cargar aulas: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAulas();
  }, []);

  const handleOpenCreate = () => {
    setEditingAula(null);
    setFormData({
      nombre: "",
      capacidad: 30,
      tiene_canonera: true,
      tiene_escritorio: true,
      tiene_pizarra: true
    });
    setErrorMsg("");
    setShowModal(true);
  };

  const handleOpenEdit = (aula) => {
    setEditingAula(aula);
    setFormData({
      nombre: aula.nombre,
      capacidad: aula.capacidad,
      tiene_canonera: aula.tiene_canonera ?? true,
      tiene_escritorio: aula.tiene_escritorio ?? true,
      tiene_pizarra: aula.tiene_pizarra ?? true
    });
    setErrorMsg("");
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim()) {
      setErrorMsg("El nombre del aula es obligatorio");
      return;
    }
    try {
      if (editingAula) {
        await api.updateAula(editingAula.id, formData);
      } else {
        await api.createAula(formData);
      }
      setShowModal(false);
      loadAulas();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Está seguro de eliminar esta aula?")) return;
    try {
      await api.deleteAula(id);
      loadAulas();
    } catch (err) {
      alert("Error al eliminar aula: " + err.message);
    }
  };

  const filteredAulas = aulas.filter(a => 
    a.nombre.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-container" style={{ padding: "2rem", width: "100%" }}>
      {/* Header Bar */}
      <div className="header-responsive">
        <div>
          <h1 style={{ fontSize: "1.75rem", margin: 0 }}>Recursos Físicos (Aulas)</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Gestión de espacios educativos, capacidad y equipamiento disponible.
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <Plus style={{ width: "18px", height: "18px" }} />
          Nueva Aula
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon-box kpi-icon-indigo">
            <Building2 style={{ width: "24px" }} />
          </div>
          <div>
            <div className="kpi-label">Total de Aulas</div>
            <div className="kpi-value">{aulas.length}</div>
            <div className="kpi-subtext">Espacios físicos disponibles</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-box kpi-icon-cyan">
            <Building2 style={{ width: "24px" }} />
          </div>
          <div>
            <div className="kpi-label">Capacidad Total</div>
            <div className="kpi-value">
              {aulas.reduce((sum, a) => sum + (a.capacidad || 0), 0)}
            </div>
            <div className="kpi-subtext">Escritorios/sillas acumuladas</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-box kpi-icon-emerald">
            <Check style={{ width: "24px" }} />
          </div>
          <div>
            <div className="kpi-label">Con Proyector / Cañonera</div>
            <div className="kpi-value">
              {aulas.filter(a => a.tiene_canonera).length} / {aulas.length}
            </div>
            <div className="kpi-subtext">Aulas con equipo multimedia</div>
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div style={{ marginBottom: "1.5rem", display: "flex", gap: "1rem" }}>
        <div style={{ position: "relative", width: "100%", maxWidth: "320px" }}>
          <Search style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", width: "16px", color: "var(--text-muted)" }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: "2.2rem" }}
            placeholder="Buscar aula por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="glass-panel table-container" style={{ padding: "1rem" }}>
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
            Cargando espacios físicos...
          </div>
        ) : filteredAulas.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
            No se encontraron aulas registradas.
          </div>
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Aula / Espacio</th>
                <th>Capacidad Máxima</th>
                <th>Cañonera</th>
                <th>Escritorio Profesor</th>
                <th>Pizarra</th>
                <th style={{ textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredAulas.map((aula) => (
                <tr key={aula.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontWeight: "600" }}>
                      <Building2 style={{ width: "18px", color: "var(--primary)" }} />
                      {aula.nombre}
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-primary">
                      {aula.capacidad} estudiantes
                    </span>
                  </td>
                  <td>
                    {aula.tiene_canonera ? (
                      <span className="badge badge-success"><Check style={{ width: "12px" }} /> Sí</span>
                    ) : (
                      <span className="badge badge-danger"><X style={{ width: "12px" }} /> No</span>
                    )}
                  </td>
                  <td>
                    {aula.tiene_escritorio ? (
                      <span className="badge badge-success"><Check style={{ width: "12px" }} /> Sí</span>
                    ) : (
                      <span className="badge badge-danger"><X style={{ width: "12px" }} /> No</span>
                    )}
                  </td>
                  <td>
                    {aula.tiene_pizarra ? (
                      <span className="badge badge-success"><Check style={{ width: "12px" }} /> Sí</span>
                    ) : (
                      <span className="badge badge-danger"><X style={{ width: "12px" }} /> No</span>
                    )}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleOpenEdit(aula)} style={{ marginRight: "0.5rem" }}>
                      <Edit2 style={{ width: "14px" }} /> Editar
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(aula.id)}>
                      <Trash2 style={{ width: "14px" }} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Dialog */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: "1.2rem" }}>
                {editingAula ? "Editar Aula" : "Nueva Aula"}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
                <X style={{ width: "20px" }} />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                {errorMsg && (
                  <div style={{ padding: "0.75rem", borderRadius: "var(--radius-sm)", background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#fca5a5", fontSize: "0.85rem", marginBottom: "1rem" }}>
                    {errorMsg}
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Nombre del Aula / Laboratorio</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej. Aula 101, Lab C-2"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Capacidad de Estudiantes</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    value={formData.capacidad}
                    onChange={(e) => setFormData({ ...formData, capacidad: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem", marginTop: "1.25rem" }}>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={formData.tiene_canonera}
                      onChange={(e) => setFormData({ ...formData, tiene_canonera: e.target.checked })}
                    />
                    <span className="toggle-slider"></span>
                    <span style={{ fontSize: "0.9rem" }}>Tiene Cañonera / Proyector</span>
                  </label>

                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={formData.tiene_escritorio}
                      onChange={(e) => setFormData({ ...formData, tiene_escritorio: e.target.checked })}
                    />
                    <span className="toggle-slider"></span>
                    <span style={{ fontSize: "0.9rem" }}>Tiene Escritorio para Catedrático</span>
                  </label>

                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={formData.tiene_pizarra}
                      onChange={(e) => setFormData({ ...formData, tiene_pizarra: e.target.checked })}
                    />
                    <span className="toggle-slider"></span>
                    <span style={{ fontSize: "0.9rem" }}>Tiene Pizarra</span>
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingAula ? "Guardar Cambios" : "Crear Aula"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
