import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { Clock, Star, CheckCircle, XCircle, Save } from "lucide-react";

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const BLOQUES = [
  "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
  "17:00", "18:00", "19:00", "20:00"
];

// Mapeos para normalizar lo que viene de la BD (ej. LUN -> Lunes, 07 -> 07:00)
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

import { useAuth } from "../context/AuthContext";

export default function DisponibilidadPage() {
  const { user, isDocente } = useAuth();
  const [catedraticos, setCatedraticos] = useState([]);
  const [selectedCatId, setSelectedCatId] = useState("");
  const [disponibilidades, setDisponibilidades] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [catData, dispData] = await Promise.all([
        api.getCatedraticos(),
        api.getDisponibilidad()
      ]);
      setCatedraticos(catData || []);
      setDisponibilidades(dispData || []);
      
      if (isDocente && user?.catedratico_id) {
        setSelectedCatId(user.catedratico_id);
      } else if (catData && catData.length > 0 && !selectedCatId) {
        setSelectedCatId(catData[0].id);
      }
    } catch (err) {
      console.error("Error al cargar disponibilidad:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Map helper: (dia, bloque_inicio) -> { id, preferido } or null
  const getSlotStatus = (dia, bloque) => {
    const found = disponibilidades.find(
      (d) => 
        d.catedratico_id === selectedCatId && 
        normDia(d.dia) === normDia(dia) && 
        normBloque(d.bloque_inicio) === normBloque(bloque)
    );
    if (!found) return { state: "ocupado", id: null };
    return {
      state: found.preferido ? "preferido" : "disponible",
      id: found.id
    };
  };

  const handleToggleSlot = async (dia, bloque) => {
    if (!selectedCatId) return;
    const current = getSlotStatus(dia, bloque);

    try {
      if (current.state === "ocupado") {
        // Change to disponible
        const newRecord = await api.createDisponibilidad({
          catedratico_id: selectedCatId,
          dia,
          bloque_inicio: bloque,
          bloque_fin: bloque,
          preferido: false
        });
        setDisponibilidades([...disponibilidades, newRecord]);
      } else if (current.state === "disponible") {
        // Change to preferido
        const updated = await api.updateDisponibilidad(current.id, { preferido: true });
        setDisponibilidades(
          disponibilidades.map((d) => (d.id === current.id ? updated : d))
        );
      } else {
        // Change to ocupado (delete)
        await api.deleteDisponibilidad(current.id);
        setDisponibilidades(disponibilidades.filter((d) => d.id !== current.id));
      }
    } catch (err) {
      alert("Error al actualizar bloque horario: " + err.message);
    }
  };

  return (
    <div className="page-container">
      {/* Header Bar */}
      <div className="header-responsive" style={{ marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", margin: 0 }}>Disponibilidad y Preferencias Horarias</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Haga clic en las celdas para alternar entre Ocupado 🔴, Disponible 🟢 y Preferido ⭐.
          </p>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon-box kpi-icon-emerald">
            <CheckCircle style={{ width: "24px" }} />
          </div>
          <div>
            <div className="kpi-label">Periodos Disponibles</div>
            <div className="kpi-value">
              {disponibilidades.filter(d => d.catedratico_id === selectedCatId && !d.preferido).length}
            </div>
            <div className="kpi-subtext">Horarios habilitados para impartir</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-box kpi-icon-amber">
            <Star style={{ width: "24px" }} />
          </div>
          <div>
            <div className="kpi-label">Horarios Preferidos</div>
            <div className="kpi-value">
              {disponibilidades.filter(d => d.catedratico_id === selectedCatId && d.preferido).length}
            </div>
            <div className="kpi-subtext">Preferencia alta del docente ⭐</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-box kpi-icon-indigo">
            <Clock style={{ width: "24px" }} />
          </div>
          <div>
            <div className="kpi-label">Carga Autorizada</div>
            <div className="kpi-value">
              {catedraticos.find(c => c.id === selectedCatId)?.carga_min || 0} - {catedraticos.find(c => c.id === selectedCatId)?.carga_max || 0} h
            </div>
            <div className="kpi-subtext">Límite asignado por la facultad</div>
          </div>
        </div>
      </div>

      {/* Professor Selector */}
      <div className="glass-panel filters-bar-responsive" style={{ padding: "1.25rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: "200px" }}>
          <Clock style={{ color: "var(--primary)" }} />
          <span style={{ fontWeight: "600", fontSize: "0.95rem" }}>Catedrático:</span>
        </div>
        <select
          className="form-select"
          style={{ minWidth: "200px", flex: 1 }}
          value={selectedCatId}
          disabled={isDocente}
          onChange={(e) => setSelectedCatId(e.target.value)}
        >
          {catedraticos.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre} (Carga: {c.carga_min}-{c.carga_max}h)
            </option>
          ))}
        </select>

        {/* Legend */}
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center", fontSize: "0.8rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "rgba(239, 68, 68, 0.4)", border: "1px solid #ef4444" }}></span>
            <span>No Disponible / Ocupado</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "rgba(16, 185, 129, 0.4)", border: "1px solid #10b981" }}></span>
            <span>Disponible</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "rgba(245, 158, 11, 0.4)", border: "1px solid #f59e0b" }}></span>
            <span>Horario Preferido ⭐</span>
          </div>
        </div>
      </div>

      {/* Availability Matrix */}
      <div className="glass-panel" style={{ padding: "1.5rem" }}>
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
            Cargando matriz de disponibilidad...
          </div>
        ) : !selectedCatId ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
            Seleccione un catedrático para configurar su disponibilidad.
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table" style={{ borderCollapse: "separate", borderSpacing: "6px", background: "transparent", minWidth: "650px" }}>
            <thead>
              <tr>
                <th style={{ width: "100px", textAlign: "center" }}>Bloque</th>
                {DIAS.map((dia) => (
                  <th key={dia} style={{ textAlign: "center", fontSize: "0.85rem" }}>{dia}</th>
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
                    const status = getSlotStatus(dia, bloque);
                    let bg = "rgba(239, 68, 68, 0.1)";
                    let border = "1px solid rgba(239, 68, 68, 0.3)";
                    let textColor = "var(--danger)";
                    let label = "Ocupado";

                    if (status.state === "disponible") {
                      bg = "rgba(5, 150, 105, 0.12)";
                      border = "1px solid rgba(5, 150, 105, 0.35)";
                      textColor = "var(--success)";
                      label = "Disponible";
                    } else if (status.state === "preferido") {
                      bg = "rgba(217, 119, 6, 0.15)";
                      border = "1px solid rgba(217, 119, 6, 0.45)";
                      textColor = "var(--accent)";
                      label = "Preferido ⭐";
                    }

                    return (
                      <td
                        key={dia}
                        onClick={() => handleToggleSlot(dia, bloque)}
                        style={{
                          background: bg,
                          border: border,
                          borderRadius: "var(--radius-sm)",
                          padding: "0.75rem",
                          textAlign: "center",
                          cursor: "pointer",
                          userSelect: "none",
                          transition: "transform 0.15s ease, background 0.15s ease",
                          color: textColor,
                          fontWeight: "600",
                          fontSize: "0.8rem"
                        }}
                      >
                        {label}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
