const express = require("express");
const router = express.Router();
const supabase = require("../config/supabaseClient");

router.get("/", async (req, res) => {
  const { data, error } = await supabase
    .from("disponibilidad")
    .select("*, catedraticos(nombre)");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post("/", async (req, res) => {
  const { catedratico_id, dia, bloque_inicio, bloque_fin, preferido } = req.body;
  const { data, error } = await supabase
    .from("disponibilidad")
    .insert([{ catedratico_id, dia, bloque_inicio, bloque_fin, preferido: preferido ?? false }])
    .select();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data[0]);
});

router.put("/:id", async (req, res) => {
  const { catedratico_id, dia, bloque_inicio, bloque_fin, preferido } = req.body;
  const updateData = {};
  if (catedratico_id !== undefined) updateData.catedratico_id = catedratico_id;
  if (dia !== undefined) updateData.dia = dia;
  if (bloque_inicio !== undefined) updateData.bloque_inicio = bloque_inicio;
  if (bloque_fin !== undefined) updateData.bloque_fin = bloque_fin;
  if (preferido !== undefined) updateData.preferido = preferido;

  const { data, error } = await supabase
    .from("disponibilidad")
    .update(updateData)
    .eq("id", req.params.id)
    .select();
  if (error) return res.status(500).json({ error: error.message });
  if (!data || data.length === 0) return res.status(404).json({ error: "Disponibilidad no encontrada" });
  res.json(data[0]);
});

router.delete("/:id", async (req, res) => {
  const { error } = await supabase.from("disponibilidad").delete().eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

module.exports = router;