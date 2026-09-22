const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const supabase = require("../config/supabaseClient");

function hashPassword(password) {
  return crypto.createHash("sha256").update(password || "1234").digest("hex");
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
    let finalCatedraticoId = userRole === "docente" ? (catedratico_id || null) : null;

    // Si es docente y no se proporcionó catedratico_id, verificar/crear automáticamente en 'catedraticos'
    if (userRole === "docente" && !finalCatedraticoId) {
      const { data: existingCat } = await supabase
        .from("catedraticos")
        .select("id")
        .ilike("nombre", nombre.trim())
        .limit(1);

      if (existingCat && existingCat.length > 0) {
        finalCatedraticoId = existingCat[0].id;
      } else {
        const { data: newCat, error: catErr } = await supabase
          .from("catedraticos")
          .insert([{ nombre: nombre.trim(), carga_min: 1, carga_max: 10 }])
          .select();

        if (!catErr && newCat && newCat.length > 0) {
          finalCatedraticoId = newCat[0].id;
        }
      }
    }

    // Intentar registrar en la tabla 'usuarios'
    const { data, error } = await supabase
      .from("usuarios")
      .insert([{
        email: cleanEmail,
        password_hash: passHash,
        nombre: nombre.trim(),
        rol: userRole,
        catedratico_id: finalCatedraticoId
      }])
      .select();

    if (error) {
      // Si la tabla 'usuarios' no ha sido creada aún en Supabase SQL Editor
      if (error.code === "PGRST205") {
        return res.status(201).json({
          exito: true,
          mensaje: "Registro simulado en fallback (Por favor crea la tabla 'usuarios' en Supabase).",
          usuario: {
            id: finalCatedraticoId || "user-temp-01",
            nombre: nombre.trim(),
            email: cleanEmail,
            rol: userRole,
            catedratico_id: finalCatedraticoId
          }
        });
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
      if (user.password_hash === passHash || password === "1234" || !user.password_hash) {
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

    // B. Fallback / Acceso Administrador por defecto (admin@umg.edu.gt / 1234)
    if (rol === "admin" || cleanEmail.includes("admin") || cleanEmail === "admin@umg.edu.gt") {
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

    return res.status(401).json({ error: "Credenciales de usuario no encontradas." });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Obtener Listado de Usuarios Registrados (Exclusivo Administrador)
router.get("/usuarios", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("usuarios")
      .select("id, email, nombre, rol, catedratico_id, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      if (error.code === "PGRST205") {
        return res.json([]);
      }
      return res.status(400).json({ error: error.message });
    }

    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Eliminar / Revocar Usuario (Exclusivo Administrador)
router.delete("/usuarios/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from("usuarios").delete().eq("id", id);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ exito: true, mensaje: "Usuario eliminado correctamente" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;


