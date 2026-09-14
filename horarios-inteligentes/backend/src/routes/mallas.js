const express = require("express");
const router = express.Router();
const supabase = require("../config/supabaseClient");

router.get("/", async (req, res) => {
  const { data, error } = await supabase.from("mallas").select("*");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post("/", async (req, res) => {
  const { nombre, semestre } = req.body;
  const { data, error } = await supabase
    .from("mallas")
    .insert([{ nombre, semestre }])
    .select();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data[0]);
});

router.put("/:id", async (req, res) => {
  const { nombre, semestre } = req.body;
  const { data, error } = await supabase
    .from("mallas")
    .update({ nombre, semestre })
    .eq("id", req.params.id)
    .select();
  if (error) return res.status(500).json({ error: error.message });
  if (!data || data.length === 0) return res.status(404).json({ error: "Malla no encontrada" });
  res.json(data[0]);
});

router.delete("/:id", async (req, res) => {
  const { error } = await supabase.from("mallas").delete().eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

module.exports = router;