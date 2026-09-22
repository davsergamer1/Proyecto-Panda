const express = require("express");
const cors = require("cors");
require("dotenv").config();
const supabase = require("./config/supabaseClient");

const app = express();
app.use(cors());
app.use(express.json());

// Rutas
const aulasRouter = require("./routes/aulas");
const mallasRouter = require("./routes/mallas");
const catedraticosRouter = require("./routes/catedraticos");
const cursosRouter = require("./routes/cursos");
const seccionesRouter = require("./routes/secciones");
const disponibilidadRouter = require("./routes/disponibilidad");
const authRouter = require("./routes/auth");
const catedraticosCursosRouter = require("./routes/catedraticosCursos");

app.use("/auth", authRouter);
app.use("/catedraticos-cursos", catedraticosCursosRouter);
app.use("/aulas", aulasRouter);
app.use("/mallas", mallasRouter);
app.use("/catedraticos", catedraticosRouter);
app.use("/cursos", cursosRouter);
app.use("/secciones", seccionesRouter);
app.use("/disponibilidad", disponibilidadRouter);
app.use("/horarios", horariosRouter);

app.get("/", (req, res) => {
  res.json({ status: "ok", mensaje: "Backend de Horarios Inteligentes activo" });
});

// Ruta de prueba: verifica que la conexión a Supabase funciona
app.get("/test-conexion", async (req, res) => {
  const { data, error } = await supabase.from("aulas").select("*");
  if (error) {
    return res.status(500).json({ conectado: false, error: error.message });
  }
  res.json({ conectado: true, aulas: data });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});