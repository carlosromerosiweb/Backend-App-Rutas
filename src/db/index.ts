import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
  // Configuración para manejar mejor las conexiones
  max: 20, // máximo número de clientes en el pool
  idleTimeoutMillis: 30000, // tiempo máximo que un cliente puede estar inactivo
  connectionTimeoutMillis: 2000, // tiempo máximo para establecer una conexión
  maxUses: 7500, // número máximo de veces que se puede usar una conexión
});

// Manejar eventos de error del pool
pool.on('error', (err, client) => {
  console.error('Error inesperado en el pool de conexiones:', err);
});

// Manejar eventos de conexión
pool.on('connect', (client) => {
  console.log('Nueva conexión establecida con la base de datos');
});

// Manejar eventos de desconexión
pool.on('remove', (client) => {
  console.log('Cliente desconectado del pool');
});

export default pool; 