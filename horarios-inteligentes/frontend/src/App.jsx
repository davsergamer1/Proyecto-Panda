import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Sidebar from "./components/Sidebar";
import LoginModal from "./components/LoginModal";
import CalendarioPage from "./pages/CalendarioPage";
import AulasPage from "./pages/AulasPage";
import MallasCursosPage from "./pages/MallasCursosPage";
import SeccionesPage from "./pages/SeccionesPage";
import CatedraticosPage from "./pages/CatedraticosPage";
import DisponibilidadPage from "./pages/DisponibilidadPage";

function AppContent() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("calendario");
  const [theme, setTheme] = useState(() => localStorage.getItem("umg_theme") || "dark");
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("umg_theme", theme);
  }, [theme]);

  // Si no hay usuario en sesión, abrir el modal de login automáticamente
  useEffect(() => {
    if (!user) {
      setShowLoginModal(true);
    }
  }, [user]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const renderContent = () => {
    switch (activeTab) {
      case "calendario":
        return <CalendarioPage theme={theme} toggleTheme={toggleTheme} />;
      case "aulas":
        return <AulasPage />;
      case "mallas":
        return <MallasCursosPage />;
      case "secciones":
        return <SeccionesPage />;
      case "catedraticos":
        return <CatedraticosPage />;
      case "disponibilidad":
        return <DisponibilidadPage />;
      default:
        return <CalendarioPage theme={theme} toggleTheme={toggleTheme} />;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        theme={theme} 
        toggleTheme={toggleTheme} 
        onOpenLogin={() => setShowLoginModal(true)}
      />
      <main className="main-content">
        {renderContent()}
      </main>

      {/* Modal de Inicio de Sesión */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
