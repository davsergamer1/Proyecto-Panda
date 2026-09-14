const express = require("express");
const router = express.Router();
const supabase = require("../config/supabaseClient");

router.get("/", async (req, res) => {
  const { data, error } = await supabase
    .from("catedraticos_cursos")
    .select("*, catedraticos(nombre), cursos(nombre)");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post("/", async (req, res) => {
  const { catedratico_id, curso_id } = req.body;
  const { data, error } = await supabase
    .from("catedraticos_cursos")
    .insert([{ catedratico_id, curso_id }])
    .select();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data[0]);
});

router.put("/:id", async (req, res) => {
  const { catedratico_id, curso_id } = req.body;
  const { data, error } = await supabase
    .from("catedraticos_cursos")
    .update({ catedratico_id, curso_id })
    .eq("id", req.params.id)
    .select();
  if (error) return res.status(500).json({ error: error.message });
  if (!data || data.length === 0) return res.status(404).json({ error: "Asignación no encontrada" });
  res.json(data[0]);
});

router.delete("/:id", async (req, res) => {
  try {
    // 1. Obtener la cualificación que se va a eliminar
    const { data: qual } = await supabase
      .from("catedraticos_cursos")
      .select("catedratico_id, curso_id")
      .eq("id", req.params.id)
      .maybeSingle();

    // 2. Eliminar la cualificación
    const { error } = await supabase
      .from("catedraticos_cursos")
      .delete()
      .eq("id", req.params.id);

    if (error) return res.status(500).json({ error: error.message });

    // 3. Purgar asignaciones obsoletas de horarios_generados
    if (qual) {
      const { data: secciones } = await supabase
        .from("secciones")
        .select("id")
        .eq("curso_id", qual.curso_id);

      if (secciones && secciones.length > 0) {
        const seccionIds = secciones.map((s) => s.id);
        await supabase
          .from("horarios_generados")
          .delete()
          .eq("catedratico_id", qual.catedratico_id)
          .in("seccion_id", seccionIds);
      }
    }

    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;