const express = require("express");
const router = express.Router();
const supabase = require("../config/supabaseClient");
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");

// Obtener horario generado (filtrando automáticamente asignaciones inválidas o huérfanas)
router.get("/", async (req, res) => {
  try {
    const [{ data: horarios, error: hErr }, { data: califs, error: cErr }] = await Promise.all([
      supabase
        .from("horarios_generados")
        .select("*, secciones(id, curso_id, cursos(id, nombre)), aulas(nombre), catedraticos(nombre)"),
      supabase.from("catedraticos_cursos").select("catedratico_id, curso_id")
    ]);

    if (hErr) return res.status(500).json({ error: hErr.message });
    if (!horarios) return res.json([]);

    const validQuals = new Set((califs || []).map(c => `${c.catedratico_id}_${c.curso_id}`));
    const invalidIds = [];

    const validHorarios = horarios.filter((h) => {
      // 1. Debe tener relaciones existentes
      if (!h.secciones || !h.catedraticos || !h.aulas || !h.secciones.cursos) {
        invalidIds.push(h.id);
        return false;
      }
      // 2. Catedrático debe estar calificado para el curso de la sección
      const key = `${h.catedratico_id}_${h.secciones.cursos.id}`;
      if (!validQuals.has(key)) {
        invalidIds.push(h.id);
        return false;
      }
      return true;
    });

    // Purgar en segundo plano cualquier registro inválido encontrado
    if (invalidIds.length > 0) {
      supabase.from("horarios_generados").delete().in("id", invalidIds).then();
    }

    res.json(validHorarios);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Disparar la optimización mediante el motor en Python
router.post("/generar", (req, res) => {
  const optimizerDir = path.resolve(__dirname, "../../../optimizer");
  const batScript = path.join(optimizerDir, "run_optimizer.bat");

  console.log("Disparando optimizador I.O. en:", optimizerDir);

  const command = process.platform === "win32" ? `"${batScript}"` : "python3 solver.py";

  exec(command, { cwd: optimizerDir, env: process.env, timeout: 60000 }, (error, stdout, stderr) => {
    const combinedOutput = (stdout || "") + "\n" + (stderr || "");

    if (error || combinedOutput.includes("[ERROR]")) {
      console.error("Error/Infactibilidad en optimizador:", combinedOutput);

      const diagLines = combinedOutput
        .split("\n")
        .filter(line => line.includes("[DIAGNÓSTICO]") || line.includes("[DIAGNOSTICO]") || line.includes("[ERROR]"))
        .map(line => line.replace(/\[DIAGNÓSTICO\]|\[DIAGNOSTICO\]|\[ERROR\]/g, "").trim())
        .filter(Boolean);

      const mainErrorMsg = diagLines.length > 0 
        ? `No se pudo optimizar: ${diagLines.join(" | ")}` 
        : "El motor de optimización no pudo encontrar un horario óptimo.";

      return res.status(400).json({ 
        exito: false, 
        error: mainErrorMsg, 
        detalle: combinedOutput || error?.message 
      });
    }

    console.log("Optimización finalizada con éxito.");
    res.json({
      exito: true,
      mensaje: "Optimización ejecutada exitosamente",
      salida: stdout
    });
  });
});

// Crear asignación manual de horario (Exclusivo Administrador)
router.post("/", async (req, res) => {
  try {
    const { seccion_id, catedratico_id, aula_id, dia, bloque } = req.body;
    if (!seccion_id || !catedratico_id || !aula_id || !dia || !bloque) {
      return res.status(400).json({ error: "Todos los campos (seccion, catedratico, aula, dia, bloque) son requeridos." });
    }

    const { data, error } = await supabase
      .from("horarios_generados")
      .insert([{ seccion_id, catedratico_id, aula_id, dia, bloque }])
      .select();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json({ exito: true, horario: data[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Editar/Reasignar horario existente (Exclusivo Administrador)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { seccion_id, catedratico_id, aula_id, dia, bloque } = req.body;

    const { data, error } = await supabase
      .from("horarios_generados")
      .update({ seccion_id, catedratico_id, aula_id, dia, bloque })
      .eq("id", id)
      .select();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ exito: true, horario: data[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Eliminar bloque individual de horario
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from("horarios_generados").delete().eq("id", id);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ exito: true, mensaje: "Bloque de horario eliminado" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Limpiar horario generado completo
router.delete("/", async (req, res) => {
  const { error } = await supabase
    .from("horarios_generados")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json({ mensaje: "Horario limpiado exitosamente" });
});

module.exports = router;