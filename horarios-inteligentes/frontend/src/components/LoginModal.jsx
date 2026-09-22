import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { GraduationCap, Shield, Users, Key, LogIn, UserPlus, AlertCircle, CheckCircle, Lock } from "lucide-react";

export default function LoginModal({ isOpen, onClose }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login"); // 'login' | 'register'
  const [roleTab, setRoleTab] = useState("admin"); // 'admin' | 'docente'
  
  // Form fields
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedCatId, setSelectedCatId] = useState("");
  
  const [catedraticos, setCatedraticos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

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

  // Si cambia a modo registro, forzar rol docente
  const handleSwitchMode = (newMode) => {
    setMode(newMode);
    setErrorMsg("");
    if (newMode === "register") {
      setRoleTab("docente");
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setErrorMsg("");
      setSuccessMsg("");

      if (mode === "register") {
        if (!nombre.trim()) {
          throw new Error("Por favor ingrese su nombre completo.");
        }
        if (!email.trim() || !password) {
          throw new Error("Por favor ingrese email y contraseña.");
        }

        await register({
          nombre,
          email,
          password,
          rol: "docente",
          catedratico_id: selectedCatId || null
        });
        setSuccessMsg("¡Cuenta de Docente registrada exitosamente!");
        setTimeout(() => {
          onClose && onClose();
        }, 500);
      } else {
        // Login mode
        if (roleTab === "admin") {
          await login({ email: email || "admin@umg.edu.gt", password, rol: "admin" });
        } else {
          await login({ catedratico_id: selectedCatId, email, password, rol: "docente" });
        }
        onClose && onClose();
      }
    } catch (err) {
      setErrorMsg(err.message || "Error al procesar la solicitud.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-fade-in" style={{ maxWidth: "480px" }}>
        {/* Header */}
        <div className="modal-header" style={{ background: "linear-gradient(135deg, rgba(29, 78, 216, 0.15) 0%, rgba(217, 119, 6, 0.15) 100%)", flexDirection: "column", alignItems: "center", padding: "1.5rem 1.5rem 1rem" }}>
          <div style={{
            width: "52px",
            height: "52px",
            borderRadius: "14px",
            background: "linear-gradient(135deg, #1d4ed8 0%, #d97706 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 6px 20px rgba(29, 78, 216, 0.35)",
            marginBottom: "0.5rem"
          }}>
            <GraduationCap style={{ width: "28px", height: "28px", color: "#ffffff" }} />
          </div>
          <h3 style={{ margin: 0, fontSize: "1.25rem", textAlign: "center", color: "var(--text-main)" }}>
            OptiHorarios UMG
          </h3>
          <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
            Sistema Académico - Universidad Mariano Gálvez
          </span>
        </div>

        {/* Mode Selector (Iniciar Sesión vs Registrarse) */}
        <div style={{ display: "flex", background: "var(--table-header-bg)", borderBottom: "1px solid var(--border-color)", padding: "4px" }}>
          <button
            type="button"
            onClick={() => handleSwitchMode("login")}
            style={{
              flex: 1,
              padding: "0.5rem",
              borderRadius: "var(--radius-sm)",
              border: "none",
              background: mode === "login" ? "var(--bg-card)" : "transparent",
              color: mode === "login" ? "var(--primary)" : "var(--text-muted)",
              fontWeight: mode === "login" ? "700" : "500",
              fontSize: "0.85rem",
              cursor: "pointer",
              boxShadow: mode === "login" ? "0 2px 4px rgba(0,0,0,0.05)" : "none"
            }}
          >
            🔑 Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => handleSwitchMode("register")}
            style={{
              flex: 1,
              padding: "0.5rem",
              borderRadius: "var(--radius-sm)",
              border: "none",
              background: mode === "register" ? "var(--bg-card)" : "transparent",
              color: mode === "register" ? "var(--primary)" : "var(--text-muted)",
              fontWeight: mode === "register" ? "700" : "500",
              fontSize: "0.85rem",
              cursor: "pointer",
              boxShadow: mode === "register" ? "0 2px 4px rgba(0,0,0,0.05)" : "none"
            }}
          >
            📝 Registro Docente
          </button>
        </div>

        {/* Role Selector Tabs (Only active/visible in Login mode) */}
        {mode === "login" ? (
          <div style={{ display: "flex", borderBottom: "1px solid var(--border-color)" }}>
            <button
              type="button"
              onClick={() => setRoleTab("admin")}
              style={{
                flex: 1,
                padding: "0.7rem",
                border: "none",
                background: roleTab === "admin" ? "var(--bg-card)" : "var(--table-header-bg)",
                color: roleTab === "admin" ? "var(--primary)" : "var(--text-muted)",
                fontWeight: roleTab === "admin" ? "700" : "500",
                fontSize: "0.83rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.4rem",
                borderBottom: roleTab === "admin" ? "2px solid var(--primary)" : "2px solid transparent"
              }}
            >
              <Shield style={{ width: "15px" }} />
              Administrador
            </button>
            <button
              type="button"
              onClick={() => setRoleTab("docente")}
              style={{
                flex: 1,
                padding: "0.7rem",
                border: "none",
                background: roleTab === "docente" ? "var(--bg-card)" : "var(--table-header-bg)",
                color: roleTab === "docente" ? "var(--accent)" : "var(--text-muted)",
                fontWeight: roleTab === "docente" ? "700" : "500",
                fontSize: "0.83rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.4rem",
                borderBottom: roleTab === "docente" ? "2px solid var(--accent)" : "2px solid transparent"
              }}
            >
              <Users style={{ width: "15px" }} />
              Catedrático Docente
            </button>
          </div>
        ) : (
          <div style={{ padding: "0.5rem 1rem", background: "rgba(29, 78, 216, 0.08)", borderBottom: "1px solid var(--border-color)", fontSize: "0.78rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <Lock style={{ width: "14px", color: "var(--primary)" }} />
            <span>Registro de nuevo Catedrático. Cuentas de Administrador solo son creadas por Coordinación.</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ padding: "1.25rem 1.5rem" }}>
            {errorMsg && (
              <div style={{ padding: "0.65rem 0.85rem", borderRadius: "var(--radius-sm)", background: "rgba(220, 38, 38, 0.12)", border: "1px solid rgba(220, 38, 38, 0.3)", color: "var(--danger)", fontSize: "0.82rem", marginBottom: "0.85rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <AlertCircle style={{ width: "16px", flexShrink: 0 }} /> {errorMsg}
              </div>
            )}

            {successMsg && (
              <div style={{ padding: "0.65rem 0.85rem", borderRadius: "var(--radius-sm)", background: "rgba(16, 185, 129, 0.12)", border: "1px solid rgba(16, 185, 129, 0.3)", color: "#10b981", fontSize: "0.82rem", marginBottom: "0.85rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <CheckCircle style={{ width: "16px", flexShrink: 0 }} /> {successMsg}
              </div>
            )}

            {mode === "register" && (
              <div className="form-group" style={{ marginBottom: "0.85rem" }}>
                <label className="form-label" style={{ fontSize: "0.8rem", marginBottom: "0.25rem" }}>Nombre Completo del Catedrático</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej. Ing. Carlos Mendoza"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="form-group" style={{ marginBottom: "0.85rem" }}>
              <label className="form-label" style={{ fontSize: "0.8rem", marginBottom: "0.25rem" }}>
                Correo Electrónico {roleTab === "admin" && mode === "login" ? "(Administración UMG)" : "(Docente)"}
              </label>
              <input
                type="email"
                className="form-input"
                placeholder={roleTab === "admin" && mode === "login" ? "admin@umg.edu.gt" : "catedratico@umg.edu.gt"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required={mode === "register" || roleTab === "admin"}
              />
            </div>

            <div className="form-group" style={{ marginBottom: "0.85rem" }}>
              <label className="form-label" style={{ fontSize: "0.8rem", marginBottom: "0.25rem" }}>Contraseña</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={mode === "register"}
              />
            </div>

            {(roleTab === "docente" || mode === "register") && (
              <div className="form-group" style={{ marginBottom: "0.85rem" }}>
                <label className="form-label" style={{ fontSize: "0.8rem", marginBottom: "0.25rem" }}>Vincular a Catedrático Registrado (Opcional)</label>
                <select
                  className="form-select"
                  value={selectedCatId}
                  onChange={(e) => setSelectedCatId(e.target.value)}
                >
                  <option value="">-- Registrar Nuevo Catedrático Automáticamente --</option>
                  {catedraticos.map((c) => (
                    <option key={c.id} value={c.id}>
                      👨‍🏫 {c.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="modal-footer" style={{ padding: "1rem 1.5rem" }}>
            <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} disabled={loading}>
              {mode === "register" ? (
                <>
                  <UserPlus style={{ width: "18px" }} />
                  {loading ? "Registrando..." : "Crear Cuenta Docente"}
                </>
              ) : (
                <>
                  <LogIn style={{ width: "18px" }} />
                  {loading ? "Ingresando..." : `Iniciar Sesión (${roleTab === "admin" ? "Admin" : "Docente"})`}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


