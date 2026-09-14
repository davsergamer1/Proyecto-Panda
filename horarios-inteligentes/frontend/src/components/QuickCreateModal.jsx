import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { Zap, X, Check, BookOpen, Users, Layers, Clock, Sparkles } from "lucide-react";

const SUGGESTED_COURSES = [
  "Inteligencia Artificial II",
  "Desarrollo Web Fullstack",
  "Análisis de Datos & Big Data",
  "Ciberseguridad Avanzada",
  "Redes de Computadoras",
  "Investigación de Operaciones",
  "Desarrollo de Apps Móviles",
  "Sistemas Operativos II"
];

export default function QuickCreateModal({ isOpen, onClose, onSuccess }) {
  const [mallas, setMallas] = useState([]);
  const [catedraticos, setCatedraticos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Form State
  const [selectedMallaId, setSelectedMallaId] = useState("");
  const [nombreCurso, setNombreCurso] = useState(SUGGESTED_COURSES[0]);
  const [horasSemana, setHorasSemana] = useState(2);
  const [selectedCatId, setSelectedCatId] = useState("");
  const [cupo, setCupo] = useState(30);

  useEffect(() => {
    if (isOpen) {
      loadDependencies();
    }
  }, [isOpen]);

  const loadDependencies = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const [mallasData, catData] = await Promise.all([
        api.getMallas(),
        api.getCatedraticos()
      ]);
      setMallas(mallasData || []);
      setCatedraticos(catData || []);

      if (mallasData && mallasData.length > 0) {
        setSelectedMallaId(mallasData[0].id);
      }
      if (catData && catData.length > 0) {
        setSelectedCatId(catData[0].id);
      }
    } catch (err) {
      setErrorMsg("Error al cargar dependencias: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSubmit = async (e) => {
    e.preventDefault();
    if (!nombreCurso.trim()) {
      setErrorMsg("Ingrese o seleccione un nombre de curso.");
      return;
    }
    if (!selectedMallaId) {
      setErrorMsg("Seleccione una malla curricular.");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg("");

      // 1. Crear el Curso
      const newCurso = await api.createCurso({
        malla_id: selectedMallaId,
        nombre: nombreCurso.trim(),
        horas_semana: parseInt(horasSemana) || 2
      });

      // 2. Crear la Sección vinculada al curso
      await api.createSeccion({
        curso_id: newCurso.id,
        cupo: parseInt(cupo) || 30
      });

      // 3. Habilitar al Catedrático seleccionado para el curso (si hay docente seleccionado)
      if (selectedCatId) {
        try {
          await api.createCatedraticoCurso({
            catedratico_id: selectedCatId,
            curso_id: newCurso.id
          });
        } catch (_) {
          // Si ya existía la habilitación, continuar
        }
      }

      setSuccessMsg("¡Sección Express creada exitosamente!");
      setTimeout(() => {
        setSuccessMsg("");
        onSuccess && onSuccess();
        onClose();
      }, 1000);

    } catch (err) {
      setErrorMsg(err.message || "Ocurrió un error en la creación rápida.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-fade-in" style={{ maxWidth: "600px" }}>
        {/* Header */}
        <div className="modal-header" style={{ background: "linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)"
            }}>
              <Zap style={{ width: "20px", color: "#ffffff" }} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.2rem" }}>Creación Rápida Express</h3>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Configura Curso + Sección + Docente en 1 Clic</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
            <X style={{ width: "22px" }} />
          </button>
        </div>

        <form onSubmit={handleQuickSubmit}>
          <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {errorMsg && (
              <div style={{ padding: "0.75rem", borderRadius: "var(--radius-sm)", background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#fca5a5", fontSize: "0.85rem" }}>
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div style={{ padding: "0.75rem", borderRadius: "var(--radius-sm)", background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.3)", color: "#6ee7b7", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Check style={{ width: "18px" }} /> {successMsg}
              </div>
            )}

            {/* Step 1: Malla Curricular / Semestre */}
            <div className="form-group">
              <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <Layers style={{ width: "16px", color: "var(--accent)" }} /> 1. Carrera / Semestre
              </label>
              <select
                className="form-select"
                value={selectedMallaId}
                onChange={(e) => setSelectedMallaId(e.target.value)}
              >
                {mallas.map((m) => (
                  <option key={m.id} value={m.id}>{m.nombre} (Semestre {m.semestre})</option>
                ))}
              </select>
            </div>

            {/* Step 2: Curso Rápido */}
            <div className="form-group">
              <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <BookOpen style={{ width: "16px", color: "var(--primary)" }} /> 2. Nombre del Curso
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Escribe o selecciona un curso sugerido..."
                value={nombreCurso}
                onChange={(e) => setNombreCurso(e.target.value)}
                style={{ marginBottom: "0.5rem" }}
              />

              {/* Course Chips */}
              <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                {SUGGESTED_COURSES.map((item) => (
                  <button
                    type="button"
                    key={item}
                    className="btn btn-secondary btn-sm"
                    style={{
                      fontSize: "0.75rem",
                      padding: "0.25rem 0.6rem",
                      background: nombreCurso === item ? "var(--primary)" : "var(--bg-card-hover)",
                      color: nombreCurso === item ? "#ffffff" : "var(--text-muted)",
                      border: nombreCurso === item ? "none" : "1px solid var(--border-color)"
                    }}
                    onClick={() => setNombreCurso(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Selector de Periodos Semanales */}
            <div className="form-group">
              <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <Clock style={{ width: "16px", color: "var(--warning)" }} /> 3. Periodos Semanales Requeridos
              </label>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                {[2, 3, 4].map((h) => (
                  <button
                    type="button"
                    key={h}
                    className="btn"
                    style={{
                      flex: 1,
                      background: horasSemana === h ? "var(--primary)" : "var(--bg-card-hover)",
                      border: horasSemana === h ? "none" : "1px solid var(--border-color)",
                      color: horasSemana === h ? "#ffffff" : "var(--text-muted)"
                    }}
                    onClick={() => setHorasSemana(h)}
                  >
                    {h} Periodos / Semana
                  </button>
                ))}
              </div>
            </div>

            {/* Step 4: Catedrático Asignado */}
            <div className="form-group">
              <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <Users style={{ width: "16px", color: "var(--success)" }} /> 4. Catedrático Asignado
              </label>
              <select
                className="form-select"
                value={selectedCatId}
                onChange={(e) => setSelectedCatId(e.target.value)}
              >
                <option value="">-- Sin Catedrático (Asignación Libre) --</option>
                {catedraticos.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre} (Carga: {c.carga_min}-{c.carga_max}h)</option>
                ))}
              </select>
            </div>

            {/* Step 5: Cupo Estimado */}
            <div className="form-group">
              <label className="form-label">5. Cupo Estimado de Estudiantes</label>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {[20, 25, 30, 40].map((c) => (
                  <button
                    type="button"
                    key={c}
                    className="btn btn-sm"
                    style={{
                      flex: 1,
                      background: cupo === c ? "var(--accent)" : "var(--bg-card-hover)",
                      border: cupo === c ? "none" : "1px solid var(--border-color)",
                      color: cupo === c ? "#ffffff" : "var(--text-muted)"
                    }}
                    onClick={() => setCupo(c)}
                  >
                    {c} Alumnos
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Creando Sección Express..." : "🚀 Generar y Habilitar Sección"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
