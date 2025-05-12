import app from './app';
import { config } from './config';
import { checkConnection, query } from './db';
import pool from './db';
import { notificationService } from './services/notification.service';

// Create users table if it doesn't exist
const createTablesIfNeeded = async (): Promise<void> => {
  try {
    // Check if users table exists
    const tableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      )
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('Tabla users no encontrada. Creando tabla...');
      
      // Create users table
      await query(`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          role VARCHAR(50) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          refresh_token TEXT,
          fcm_token VARCHAR(255)
        )
      `);
      
      console.log('Tabla users creada exitosamente');
    } else {
      console.log('Tabla users ya existe, no es necesario crearla');
    }
  } catch (error) {
    console.error('Error al crear tablas:', error);
    throw error;
  }
};

// Start the server
const startServer = async (): Promise<void> => {
  let server;
  try {
    // Test database connection and create tables if needed
    try {
      console.log('Verificando conexión a la base de datos...');
      const isConnected = await checkConnection(5); // 5 intentos
      if (!isConnected) {
        throw new Error('No se pudo establecer conexión con la base de datos después de varios intentos');
      }
      
      console.log('Conexión a la base de datos establecida correctamente');
      await createTablesIfNeeded();
      
      // Inicializar tablas de notificaciones
      await notificationService.initializeTables().then(success => {
        if (success) {
          console.log('Tablas de notificaciones inicializadas correctamente');
        } else {
          console.warn('No se pudieron inicializar las tablas de notificaciones');
        }
      });
      
      // Buscar al usuario Kojima después de iniciar el servidor
      try {
        const result = await query('SELECT id, email, name, role FROM users WHERE name ILIKE $1', ['%Kojima%']);
        if (result.rows.length > 0) {
          console.log('¡Usuario Kojima encontrado en la base de datos!');
          console.log('Información del usuario:', result.rows[0]);
        } else {
          console.log('No se encontró ningún usuario con nombre similar a Kojima');
        }
      } catch (errorKojima) {
        console.error('Error al buscar usuario Kojima:', errorKojima);
      }
    } catch (dbError) {
      console.error('Error crítico en la base de datos:', dbError);
      process.exit(1); // Terminar la aplicación si no hay conexión a la base de datos
    }

    // Start listening for requests
    const PORT = Number(config.port);
    server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
      console.log(`Environment: ${config.nodeEnv}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }

  // Manejo de señales de terminación
  const shutdown = async () => {
    console.log('Cerrando servidor y conexiones...');
    if (server) {
      server.close(() => {
        console.log('Servidor HTTP cerrado');
      });
    }
    try {
      await pool.end();
      console.log('Conexiones a la base de datos cerradas');
      process.exit(0);
    } catch (error) {
      console.error('Error al cerrar conexiones:', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start the server
startServer();
