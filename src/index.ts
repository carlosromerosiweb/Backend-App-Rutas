import 'dotenv/config';
import express from "express";
import cors from "cors";
import authRoutes from './routes/auth';
import leadsRoutes from './routes/leads';
import visitasRoutes from './routes/visitas';
import notasRoutes from './routes/notas';
import adjuntosRoutes from './routes/adjuntos';
import historialRoutes from './routes/historial';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/visitas', visitasRoutes);
app.use('/api/leads', notasRoutes);
app.use('/api/leads', adjuntosRoutes);
app.use('/api/leads', historialRoutes);

// Ruta de prueba
app.get("/", (req, res) => {
  res.json({ message: "Bienvenido a la API de Rutas Comerciales" });
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
