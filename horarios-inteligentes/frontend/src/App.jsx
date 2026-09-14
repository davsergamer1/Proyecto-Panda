import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import CalendarioPage from "./pages/CalendarioPage";
import AulasPage from "./pages/AulasPage";
import MallasCursosPage from "./pages/MallasCursosPage";
import SeccionesPage from "./pages/SeccionesPage";
import CatedraticosPage from "./pages/CatedraticosPage";
import DisponibilidadPage from "./pages/DisponibilidadPage";

export default function App() {
  const [activeTab, setActiveTab] = useState("calendario");
  const [theme, setTheme] = useState(() => localStorage.getItem("umg_theme") || "dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("umg_theme", theme);
  }, [theme]);

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
      />
      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
}
