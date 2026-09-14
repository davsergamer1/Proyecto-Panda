const express = require("express");
const router = express.Router();
const supabase = require("../config/supabaseClient");

router.get("/", async (req, res) => {
  const { data, error } = await supabase.from("cursos").select("*, mallas(nombre)");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post("/", async (req, res) => {
  const { malla_id, nombre, horas_semana } = req.body;
  const { data, error } = await supabase
    .from("cursos")
    .insert([{ 
      malla_id, 
      nombre, 
      horas_semana: parseInt(horas_semana) || 2
    }])
    .select();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data[0]);
});

router.put("/:id", async (req, res) => {
  const { malla_id, nombre, horas_semana } = req.body;
  const updateData = {};
  if (malla_id) updateData.malla_id = malla_id;
  if (nombre) updateData.nombre = nombre;
  if (horas_semana !== undefined) updateData.horas_semana = parseInt(horas_semana) || 2;

  const { data, error } = await supabase
    .from("cursos")
    .update(updateData)
    .eq("id", req.params.id)
    .select();
  if (error) return res.status(500).json({ error: error.message });
  if (!data || data.length === 0) return res.status(404).json({ error: "Curso no encontrado" });
  res.json(data[0]);
});

router.delete("/:id", async (req, res) => {
  const { error } = await supabase.from("cursos").delete().eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

module.exports = router;