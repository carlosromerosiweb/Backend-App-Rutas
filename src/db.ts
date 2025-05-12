import { Pool, PoolConfig } from 'pg';
import { config } from './config';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const dbConfig: PoolConfig = {
  connectionString: config.databaseUrl,
  ssl: {
    rejectUnauthorized: false
  },
  // Configuración de reconexión
  max: 10, // reducimos el número máximo de clientes
  idleTimeoutMillis: 10000, // reducimos el tiempo de inactividad
  connectionTimeoutMillis: 5000, // aumentamos el timeout de conexión
  maxUses: 7500,
  // Configuración de keepalive
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
  // Configuración de reconexión
  application_name: 'backend_rutas',
  statement_timeout: 30000, // 30 segundos
  query_timeout: 30000, // 30 segundos
  idle_in_transaction_session_timeout: 30000, // 30 segundos
};

const pool = new Pool(dbConfig);

// Manejo de eventos del pool
pool.on('connect', (client) => {
  console.log('[DB] Nueva conexión establecida con la base de datos');
  // Configurar el cliente para mantener la conexión viva
  client.on('error', (err) => {
    console.error('[DB] Error en el cliente:', err);
  });
});

pool.on('error', (err) => {
  console.error('[DB] Error inesperado en el pool de conexiones:', err);
});

pool.on('acquire', (client) => {
  console.log('[DB] Cliente adquirido del pool');
});

pool.on('remove', (client) => {
  console.log('[DB] Cliente removido del pool');
});

// Función para verificar la conexión con reintentos
export const checkConnection = async (retries = 3): Promise<boolean> => {
  for (let i = 0; i < retries; i++) {
    try {
      const client = await pool.connect();
      try {
        const result = await client.query('SELECT NOW()');
        console.log('[DB] Conexión exitosa:', result.rows[0]);
        return true;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error(`[DB] Error en intento ${i + 1} de ${retries}:`, error);
      if (i < retries - 1) {
        // Esperar antes de reintentar (backoff exponencial)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
  }
  return false;
};

// Función para ejecutar consultas con reintentos
export const query = async (text: string, params?: any[], retries = 3) => {
  let lastError;
  
  for (let i = 0; i < retries; i++) {
    try {
      const client = await pool.connect();
      try {
        const result = await client.query(text, params);
        return result;
      } finally {
        client.release();
      }
    } catch (error) {
      lastError = error;
      console.error(`[DB] Error en intento ${i + 1} de ${retries}:`, error);
      
      if (i < retries - 1) {
        // Esperar antes de reintentar (backoff exponencial)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
  }
  
  throw lastError;
};

// Función para cerrar el pool
export const closePool = async () => {
  try {
    await pool.end();
    console.log('[DB] Pool de conexiones cerrado correctamente');
  } catch (error) {
    console.error('[DB] Error al cerrar el pool:', error);
  }
};

export default pool;
