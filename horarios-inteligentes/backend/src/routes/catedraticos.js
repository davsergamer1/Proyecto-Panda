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
    await supabase.from("horarios_generados").delete().eq("catedratico_id", req.params.id);
    const { error } = await supabase.from("catedraticos").delete().eq("id", req.params.id);
    if (error) return res.status(500).json({ error: error.message });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;