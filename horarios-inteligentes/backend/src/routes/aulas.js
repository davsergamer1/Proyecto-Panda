const express = require("express");
const router = express.Router();
const supabase = require("../config/supabaseClient");

// Obtener todas las aulas
router.get("/", async (req, res) => {
  const { data, error } = await supabase.from("aulas").select("*");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Crear una nueva aula
router.post("/", async (req, res) => {
  const { nombre, capacidad, tiene_canonera, tiene_escritorio, tiene_pizarra } = req.body;
  const { data, error } = await supabase
    .from("aulas")
    .insert([{ nombre, capacidad, tiene_canonera, tiene_escritorio, tiene_pizarra }])
    .select();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data[0]);
});

// Actualizar un aula
router.put("/:id", async (req, res) => {
  const { nombre, capacidad, tiene_canonera, tiene_escritorio, tiene_pizarra } = req.body;
  const { data, error } = await supabase
    .from("aulas")
    .update({ nombre, capacidad, tiene_canonera, tiene_escritorio, tiene_pizarra })
    .eq("id", req.params.id)
    .select();
  if (error) return res.status(500).json({ error: error.message });
  if (!data || data.length === 0) return res.status(404).json({ error: "Aula no encontrada" });
  res.json(data[0]);
});

// Eliminar un aula
router.delete("/:id", async (req, res) => {
  const { error } = await supabase.from("aulas").delete().eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

module.exports = router;