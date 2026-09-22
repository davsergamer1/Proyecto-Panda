import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { GraduationCap, Shield, Users, Key, LogIn, Check, AlertCircle } from "lucide-react";

export default function LoginModal({ isOpen, onClose }) {
  const { login } = useAuth();
  const [activeTab, setActiveTab] = useState("admin"); // 'admin' | 'docente'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [catedraticos, setCatedraticos] = useState([]);
  const [selectedCatId, setSelectedCatId] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isOpen) {
      api.getCatedraticos().then(data => {
        setCatedraticos(data || []);
        if (data && data.length > 0) {
          setSelectedCatId(data[0].id);
        }
      }).catch(_ => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setErrorMsg("");

      if (activeTab === "admin") {
        await login({ email: email || "admin@umg.edu.gt", password, rol: "admin" });
      } else {
        await login({ catedratico_id: selectedCatId, email, rol: "docente" });
      }

      onClose && onClose();
    } catch (err) {
      setErrorMsg(err.message || "Error al iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAdmin = async () => {
    try {
      setLoading(true);
      await login({ email: "admin@umg.edu.gt", rol: "admin" });
      onClose && onClose();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoDocente = async () => {
    try {
      setLoading(true);
      const catId = selectedCatId || (catedraticos[0]?.id);
      await login({ catedratico_id: catId, rol: "docente" });
      onClose && onClose();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-fade-in" style={{ maxWidth: "480px" }}>
        {/* Header */}
        <div className="modal-header" style={{ background: "linear-gradient(135deg, rgba(29, 78, 216, 0.15) 0%, rgba(217, 119, 6, 0.15) 100%)", flexDirection: "column", alignItems: "center", padding: "1.75rem 1.5rem 1.25rem" }}>
          <div style={{
            width: "54px",
            height: "54px",
            borderRadius: "16px",
            background: "linear-gradient(135deg, #1d4ed8 0%, #d97706 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 6px 20px rgba(29, 78, 216, 0.4)",
            marginBottom: "0.75rem"
          }}>
            <GraduationCap style={{ width: "30px", height: "30px", color: "#ffffff" }} />
          </div>
          <h3 style={{ margin: 0, fontSize: "1.35rem", textAlign: "center", color: "var(--text-main)" }}>
            OptiHorarios UMG
          </h3>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
            Universidad Mariano Gálvez de Guatemala
          </span>
        </div>

        {/* Role Selector Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--border-color)", background: "var(--table-header-bg)" }}>
          <button
            type="button"
            onClick={() => setActiveTab("admin")}
            style={{
              flex: 1,
              padding: "0.85rem",
              border: "none",
              background: activeTab === "admin" ? "var(--bg-card)" : "transparent",
              color: activeTab === "admin" ? "var(--primary)" : "var(--text-muted)",
              fontWeight: activeTab === "admin" ? "700" : "500",
              fontSize: "0.88rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.4rem",
              borderBottom: activeTab === "admin" ? "3px solid var(--primary)" : "3px solid transparent"
            }}
          >
            <Shield style={{ width: "16px" }} />
            Administrador
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("docente")}
            style={{
              flex: 1,
              padding: "0.85rem",
              border: "none",
              background: activeTab === "docente" ? "var(--bg-card)" : "transparent",
              color: activeTab === "docente" ? "var(--accent)" : "var(--text-muted)",
              fontWeight: activeTab === "docente" ? "700" : "500",
              fontSize: "0.88rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.4rem",
              borderBottom: activeTab === "docente" ? "3px solid var(--accent)" : "3px solid transparent"
            }}
          >
            <Users style={{ width: "16px" }} />
            Catedrático Docente
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ padding: "1.5rem" }}>
            {errorMsg && (
              <div style={{ padding: "0.75rem", borderRadius: "var(--radius-sm)", background: "rgba(220, 38, 38, 0.12)", border: "1px solid rgba(220, 38, 38, 0.3)", color: "var(--danger)", fontSize: "0.85rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <AlertCircle style={{ width: "18px" }} /> {errorMsg}
              </div>
            )}

            {activeTab === "admin" ? (
              <>
                <div className="form-group">
                  <label className="form-label">Correo Electrónico (Coordinación UMG)</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="admin@umg.edu.gt"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Contraseña</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label">Seleccionar Catedrático / Profesor</label>
                  <select
                    className="form-select"
                    value={selectedCatId}
                    onChange={(e) => setSelectedCatId(e.target.value)}
                  >
                    {catedraticos.map((c) => (
                      <option key={c.id} value={c.id}>
                        👨‍🏫 {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Contraseña / PIN Docente (Opcional)</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </>
            )}

            {/* Quick Demo Access Buttons */}
            <div style={{ marginTop: "1.25rem", padding: "1rem", background: "var(--table-header-bg)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
              <div style={{ fontSize: "0.78rem", fontWeight: "700", color: "var(--text-muted)", marginBottom: "0.6rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                ⚡ Acceso Rápido de Prueba (1-Clic)
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="button"
                  onClick={handleDemoAdmin}
                  disabled={loading}
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1, fontSize: "0.78rem", justifyContent: "center" }}
                >
                  <Shield style={{ width: "14px", color: "var(--primary)" }} />
                  Demo Admin
                </button>
                <button
                  type="button"
                  onClick={handleDemoDocente}
                  disabled={loading}
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1, fontSize: "0.78rem", justifyContent: "center" }}
                >
                  <Users style={{ width: "14px", color: "var(--accent)" }} />
                  Demo Docente
                </button>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
              <LogIn style={{ width: "18px" }} />
              {loading ? "Iniciando Sesión..." : `Ingresar como ${activeTab === "admin" ? "Administrador" : "Docente"}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
