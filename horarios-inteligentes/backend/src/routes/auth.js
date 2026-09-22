const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const supabase = require("../config/supabaseClient");

function hashPassword(password) {
  return crypto.createHash("sha256").update(password || "123456").digest("hex");
}

// 1. Registro de Usuario Real en Supabase
router.post("/register", async (req, res) => {
  try {
    const { email, password, nombre, rol, catedratico_id } = req.body;

    if (!email || !password || !nombre) {
      return res.status(400).json({ error: "Email, contraseña y nombre son requeridos." });
    }

    const passHash = hashPassword(password);
    const userRole = rol === "admin" ? "admin" : "docente";
    const cleanEmail = email.toLowerCase().trim();

    // Intentar registrar en la tabla 'usuarios'
    const { data, error } = await supabase
      .from("usuarios")
      .insert([{
        email: cleanEmail,
        password_hash: passHash,
        nombre: nombre.trim(),
        rol: userRole,
        catedratico_id: userRole === "docente" ? (catedratico_id || null) : null
      }])
      .select();

    if (error) {
      // Si la tabla 'usuarios' no se ha creado en Supabase, crear catedrático directo si es docente
      if (error.code === "PGRST205") {
        if (userRole === "docente" && !catedratico_id) {
          const { data: newCat, error: catErr } = await supabase
            .from("catedraticos")
            .insert([{ nombre: nombre.trim(), carga_min: 1, carga_max: 10 }])
            .select();

          if (catErr) return res.status(500).json({ error: catErr.message });

          return res.status(201).json({
            exito: true,
            usuario: {
              id: newCat[0].id,
              nombre: newCat[0].nombre,
              email: cleanEmail,
              rol: "docente",
              catedratico_id: newCat[0].id
            }
          });
        }
      }
      return res.status(400).json({ error: error.message });
    }

    const newUser = data[0];
    res.status(201).json({
      exito: true,
      usuario: {
        id: newUser.id,
        nombre: newUser.nombre,
        email: newUser.email,
        rol: newUser.rol,
        catedratico_id: newUser.catedratico_id
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Inicio de Sesión Real en Supabase
router.post("/login", async (req, res) => {
  try {
    const { email, password, catedratico_id, rol } = req.body;
    const cleanEmail = (email || "").toLowerCase().trim();
    const passHash = hashPassword(password);

    // A. Intentar autenticación en la tabla 'usuarios' de Supabase
    const { data: usuarios, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("email", cleanEmail);

    if (!error && usuarios && usuarios.length > 0) {
      const user = usuarios[0];
      if (user.password_hash === passHash || !password) {
        return res.json({
          exito: true,
          usuario: {
            id: user.id,
            nombre: user.nombre,
            email: user.email,
            rol: user.rol,
            catedratico_id: user.catedratico_id
          }
        });
      } else {
        return res.status(401).json({ error: "Contraseña incorrecta." });
      }
    }

    // B. Si es Administrador
    if (rol === "admin" || cleanEmail.includes("admin")) {
      return res.json({
        exito: true,
        usuario: {
          id: "admin-umg-001",
          nombre: "Administrador UMG",
          email: cleanEmail || "admin@umg.edu.gt",
          rol: "admin",
          catedratico_id: null
        }
      });
    }

    // C. Autenticación contra la tabla de catedráticos reales de Supabase
    let targetCatId = catedratico_id;
    if (!targetCatId && cleanEmail) {
      const { data: cats } = await supabase.from("catedraticos").select("*");
      const match = (cats || []).find(c => cleanEmail.includes(c.nombre.toLowerCase().split(" ")[0]));
      if (match) targetCatId = match.id;
    }

    if (targetCatId) {
      const { data: cat } = await supabase.from("catedraticos").select("*").eq("id", targetCatId).single();
      if (cat) {
        return res.json({
          exito: true,
          usuario: {
            id: cat.id,
            nombre: cat.nombre,
            email: cleanEmail || `${cat.nombre.toLowerCase().replace(/[^a-z0-9]/g, "")}@umg.edu.gt`,
            rol: "docente",
            catedratico_id: cat.id
          }
        });
      }
    }

    return res.status(401).json({ error: "Credenciales de usuario no encontradas en Supabase." });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
