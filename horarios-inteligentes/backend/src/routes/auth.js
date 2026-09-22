const express = require("express");
const router = express.Router();
const supabase = require("../config/supabaseClient");

// Login Endpoint
router.post("/login", async (req, res) => {
  try {
    const { email, password, catedratico_id, rol } = req.body;

    // 1. Acceso Administrador Demo / Formulario
    if (rol === "admin" || email === "admin@umg.edu.gt") {
      return res.json({
        exito: true,
        usuario: {
          id: "admin-umg-001",
          nombre: "Administrador UMG",
          email: email || "admin@umg.edu.gt",
          rol: "admin",
          catedratico_id: null
        }
      });
    }

    // 2. Acceso Catedrático / Docente
    if (catedratico_id) {
      const { data: cat, error } = await supabase
        .from("catedraticos")
        .select("*")
        .eq("id", catedratico_id)
        .single();

      if (error || !cat) {
        return res.status(404).json({ error: "Catedrático no encontrado" });
      }

      return res.json({
        exito: true,
        usuario: {
          id: cat.id,
          nombre: cat.nombre,
          email: `${cat.nombre.toLowerCase().replace(/[^a-z0-9]/g, "")}@umg.edu.gt`,
          rol: "docente",
          catedratico_id: cat.id
        }
      });
    }

    // Búsqueda por email o nombre
    if (email) {
      const { data: catedraticos } = await supabase.from("catedraticos").select("*");
      const match = (catedraticos || []).find(c => 
        c.nombre.toLowerCase().includes(email.toLowerCase().split("@")[0]) ||
        email.toLowerCase().includes(c.nombre.toLowerCase().split(" ")[0])
      );

      if (match) {
        return res.json({
          exito: true,
          usuario: {
            id: match.id,
            nombre: match.nombre,
            email: email,
            rol: "docente",
            catedratico_id: match.id
          }
        });
      }
    }

    // Default fallback para Login Docente genérico
    return res.json({
      exito: true,
      usuario: {
        id: "docente-gen-001",
        nombre: "Docente UMG",
        email: email || "docente@umg.edu.gt",
        rol: "docente",
        catedratico_id: null
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
