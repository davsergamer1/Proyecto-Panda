const express = require("express");
const router = express.Router();
const supabase = require("../config/supabaseClient");

router.get("/", async (req, res) => {
  const { data, error } = await supabase.from("secciones").select("*, cursos(nombre)");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post("/", async (req, res) => {
  const { curso_id, cupo } = req.body;
  const { data, error } = await supabase
    .from("secciones")
    .insert([{ curso_id, cupo }])
    .select();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data[0]);
});

router.put("/:id", async (req, res) => {
  const { curso_id, cupo } = req.body;
  const { data, error } = await supabase
    .from("secciones")
    .update({ curso_id, cupo })
    .eq("id", req.params.id)
    .select();
  if (error) return res.status(500).json({ error: error.message });
  if (!data || data.length === 0) return res.status(404).json({ error: "Sección no encontrada" });
  res.json(data[0]);
});

router.delete("/:id", async (req, res) => {
  try {
    await supabase.from("horarios_generados").delete().eq("seccion_id", req.params.id);
    const { error } = await supabase.from("secciones").delete().eq("id", req.params.id);
    if (error) return res.status(500).json({ error: error.message });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;