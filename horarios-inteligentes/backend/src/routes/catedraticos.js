const express = require("express");
const router = express.Router();
const supabase = require("../config/supabaseClient");

router.get("/", async (req, res) => {
  const { data, error } = await supabase.from("catedraticos").select("*");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post("/", async (req, res) => {
  const { nombre, carga_min, carga_max } = req.body;
  const { data, error } = await supabase
    .from("catedraticos")
    .insert([{ nombre, carga_min, carga_max }])
    .select();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data[0]);
});

router.put("/:id", async (req, res) => {
  const { nombre, carga_min, carga_max } = req.body;
  const { data, error } = await supabase
    .from("catedraticos")
    .update({ nombre, carga_min, carga_max })
    .eq("id", req.params.id)
    .select();
  if (error) return res.status(500).json({ error: error.message });
  if (!data || data.length === 0) return res.status(404).json({ error: "Catedrático no encontrado" });
  res.json(data[0]);
});

router.delete("/:id", async (req, res) => {
  try {
    const catId = req.params.id;
    // 1. Eliminar cuentas de usuarios vinculadas
    await supabase.from("usuarios").delete().eq("catedratico_id", catId);
    // 2. Eliminar horarios, habilitaciones y disponibilidad
    await supabase.from("horarios_generados").delete().eq("catedratico_id", catId);
    await supabase.from("catedraticos_cursos").delete().eq("catedratico_id", catId);
    await supabase.from("disponibilidad").delete().eq("catedratico_id", catId);
    // 3. Eliminar catedrático
    const { error } = await supabase.from("catedraticos").delete().eq("id", catId);
    if (error) return res.status(500).json({ error: error.message });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;