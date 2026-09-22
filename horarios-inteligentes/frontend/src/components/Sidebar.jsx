import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { 
  Calendar, 
  Building2, 
  BookOpen, 
  Layers, 
  Users, 
  Clock, 
  GraduationCap,
  Sun,
  Moon,
  Menu,
  X,
  Shield,
  LogOut,
  UserCheck
} from "lucide-react";

export default function Sidebar({ activeTab, setActiveTab, theme, toggleTheme, onOpenLogin }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAdmin, isDocente, logout } = useAuth();

  const menuItems = [
    { id: "calendario", label: "Calendario & Solver I.O.", icon: Calendar },
    { id: "aulas", label: "Recursos Físicos (Aulas)", icon: Building2 },
    { id: "mallas", label: "Mallas & Cursos", icon: BookOpen },
    { id: "secciones", label: "Secciones Abiertas", icon: Layers },
    { id: "catedraticos", label: "Catedráticos & Cargas", icon: Users },
    { id: "disponibilidad", label: "Disponibilidad Horaria", icon: Clock },
  ];

  const handleSelectTab = (id) => {
    setActiveTab(id);
    setMobileOpen(false);
  };

  const activeItem = menuItems.find((m) => m.id === activeTab);

  return (
    <>
      {/* Mobile Top Header (Visible on <1024px) */}
      <header className="mobile-header" style={{
        display: "none",
        width: "100%",
        padding: "1rem 1.25rem",
        backgroundColor: "var(--bg-sidebar)",
        borderBottom: "1px solid var(--border-color)",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 50
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
          <div style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #1d4ed8 0%, #d97706 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 10px rgba(29, 78, 216, 0.4)"
          }}>
            <GraduationCap style={{ width: "20px", height: "20px", color: "#ffffff" }} />
          </div>
          <div>
            <h2 style={{ fontSize: "1rem", margin: 0, color: "var(--text-main)", fontWeight: "800", letterSpacing: "-0.01em" }}>
              OptiHorarios UMG
            </h2>
            <span style={{ fontSize: "0.7rem", color: "var(--accent)", fontWeight: "600" }}>
              {activeItem?.label}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button
            onClick={toggleTheme}
            className="theme-toggle-btn"
            title="Cambiar Modo Claro/Oscuro"
            style={{ padding: "0.4rem 0.6rem" }}
          >
            {theme === "dark" ? <Sun style={{ width: "18px", color: "#f59e0b" }} /> : <Moon style={{ width: "18px", color: "#1d4ed8" }} />}
          </button>

          <button 
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{
              background: "transparent",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-md)",
              padding: "0.4rem",
              color: "var(--text-main)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            {mobileOpen ? <X style={{ width: "22px" }} /> : <Menu style={{ width: "22px" }} />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(9, 13, 22, 0.7)",
            backdropFilter: "blur(4px)",
            zIndex: 90
          }}
        />
      )}

      {/* Main Sidebar Container */}
      <aside 
        className={`sidebar-container ${mobileOpen ? "mobile-open" : ""}`}
        style={{
          width: "280px",
          minWidth: "280px",
          backgroundColor: "var(--bg-sidebar)",
          borderRight: "1px solid var(--border-color)",
          display: "flex",
          flexDirection: "column",
          padding: "1.5rem 1rem",
          gap: "1.25rem",
          zIndex: 100,
          transition: "background-color 0.25s ease, border-color 0.25s ease"
        }}
      >
        {/* Brand Logo / Title - UMG Official Academic Styling */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", padding: "0 0.5rem" }}>
          <div style={{
            width: "44px",
            height: "44px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #1d4ed8 0%, #d97706 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 16px rgba(29, 78, 216, 0.3)",
            flexShrink: 0
          }}>
            <GraduationCap style={{ width: "24px", height: "24px", color: "#ffffff" }} />
          </div>
          <div>
            <h2 style={{ fontSize: "1.15rem", fontWeight: "800", margin: 0, color: "var(--text-main)", letterSpacing: "-0.02em" }}>
              OptiHorarios
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginTop: "0.1rem" }}>
              <span style={{ 
                fontSize: "0.68rem", 
                background: "var(--accent)", 
                color: "#ffffff", 
                padding: "0.1rem 0.4rem", 
                borderRadius: "4px", 
                fontWeight: "700" 
              }}>
                UMG
              </span>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: "600" }}>
                Ing. Sistemas
              </span>
            </div>
          </div>
        </div>

        {/* User Session Profile Card */}
        <div style={{
          padding: "0.85rem",
          borderRadius: "var(--radius-md)",
          background: isAdmin ? "rgba(29, 78, 216, 0.12)" : "rgba(217, 119, 6, 0.12)",
          border: `1px solid ${isAdmin ? "rgba(29, 78, 216, 0.3)" : "rgba(217, 119, 6, 0.3)"}`,
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem"
        }}>
          {user ? (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ 
                  fontSize: "0.72rem", 
                  fontWeight: "800", 
                  textTransform: "uppercase", 
                  letterSpacing: "0.05em",
                  color: isAdmin ? "var(--primary)" : "var(--accent)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem"
                }}>
                  {isAdmin ? <Shield style={{ width: "13px" }} /> : <UserCheck style={{ width: "13px" }} />}
                  {isAdmin ? "Administrador" : "Catedrático Docente"}
                </span>

                <button
                  type="button"
                  onClick={logout}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: "0.2rem 0.4rem", fontSize: "0.7rem" }}
                  title="Cerrar Sesión"
                >
                  <LogOut style={{ width: "12px" }} /> Salir
                </button>
              </div>

              <div style={{ fontSize: "0.9rem", fontWeight: "700", color: "var(--text-main)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user.nombre}
              </div>
            </>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "600" }}>
                Sin Sesión Iniciada
              </span>
              <button
                type="button"
                onClick={onOpenLogin}
                className="btn btn-primary btn-sm"
                style={{ fontSize: "0.75rem", padding: "0.3rem 0.6rem" }}
              >
                Ingresar
              </button>
            </div>
          )}
        </div>

        {/* Theme Switcher Card in Sidebar */}
        <div style={{
          padding: "0.6rem 0.85rem",
          borderRadius: "var(--radius-md)",
          background: "var(--table-header-bg)",
          border: "1px solid var(--border-color)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "600", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            {theme === "dark" ? <Moon style={{ width: "15px", color: "#60a5fa" }} /> : <Sun style={{ width: "15px", color: "#f59e0b" }} />}
            Modo Visual
          </span>
          <button
            onClick={toggleTheme}
            className="theme-toggle-btn"
            style={{ padding: "0.3rem 0.65rem", fontSize: "0.78rem" }}
          >
            {theme === "dark" ? "🌙 Oscuro" : "☀️ Claro"}
          </button>
        </div>

        {/* Navigation Links */}
        <nav style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.85rem",
                  padding: "0.75rem 1rem",
                  borderRadius: "var(--radius-md)",
                  border: "none",
                  background: isActive 
                    ? "var(--primary)" 
                    : "transparent",
                  color: isActive ? "#ffffff" : "var(--text-muted)",
                  fontWeight: isActive ? "700" : "500",
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.2s ease",
                  boxShadow: isActive ? "0 4px 12px var(--primary-glow)" : "none",
                  borderLeft: isActive ? "4px solid var(--accent)" : "4px solid transparent"
                }}
              >
                <Icon style={{ 
                  width: "18px", 
                  height: "18px", 
                  color: isActive ? "#ffffff" : "var(--text-dim)" 
                }} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer Info Badge */}
        <div style={{ marginTop: "auto", padding: "0.85rem", borderRadius: "var(--radius-md)", background: "var(--table-header-bg)", border: "1px solid var(--border-color)" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--text-main)", fontWeight: "700", marginBottom: "0.2rem" }}>
            Universidad Mariano Gálvez
          </div>
          <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", margin: 0 }}>
            San Juan Sacatepéquez
          </p>
          <div style={{ marginTop: "0.4rem", fontSize: "0.68rem", color: "var(--accent)", fontWeight: "700" }}>
            Investigación de Operaciones
          </div>
        </div>
      </aside>

      <style>{`
        @media (max-width: 1024px) {
          .mobile-header {
            display: flex !important;
          }
          .sidebar-container {
            position: fixed !important;
            top: 0 !important;
            bottom: 0 !important;
            left: -300px !important;
            transition: left 0.3s ease !important;
            box-shadow: 10px 0 25px rgba(0,0,0,0.3) !important;
          }
          .sidebar-container.mobile-open {
            left: 0 !important;
          }
        }
      `}</style>
    </>
  );
}
