import express, { Application } from 'express';
import path from 'path';
import jwt from 'jsonwebtoken';
import routes from './routes';
import { config } from './config';
import pool from './db';
import { corsMiddleware } from './cors';
import { JwtPayload } from './types';
import notificationRoutes from './routes/notifications.routes';
import directionsRoutes from './routes/directions.routes';
import logsRoutes from './routes/logsRoutes';
import leadExportRoutes from './routes/leadExportRoutes';
import routeOptimizationRoutes from './routes/routeOptimization';
import { ReminderScheduler } from './jobs/reminder.scheduler';

// Create Express application
const app: Application = express();

// Aplicar nuestro middleware personalizado CORS
app.use(corsMiddleware);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos desde la carpeta public
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api', routes);

// Para compatibilidad con el frontend, mantenemos las rutas sin /api
app.use('/', routes);

// Rutas protegidas
app.use('/api/notifications', notificationRoutes);
app.use('/api/directions', directionsRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/leads/export', leadExportRoutes);
app.use('/api/routes', routeOptimizationRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Endpoint público de prueba para CORS y conexiones externas
app.get('/test-api', (req, res) => {
  res.status(200).json({
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString(),
    headers: req.headers,
    cors: 'headers establecidos',
    note: 'Este endpoint es público y no requiere autenticación'
  });
});

// Endpoint de prueba para verificar la funcionalidad de leads
app.get('/test-leads', async (req, res) => {
  try {
    // Contar cuántos leads hay en la base de datos
    const result = await pool.query('SELECT COUNT(*) FROM leads');
    const leadCount = result.rows[0].count;
    
    // Obtener una pequeña muestra de leads (limitado a 5)
    const sampleResult = await pool.query('SELECT id, name, email, type, status, created_at FROM leads LIMIT 5');
    
    res.status(200).json({
      message: 'Test de leads funcionando correctamente',
      totalLeads: leadCount,
      sampleLeads: sampleResult.rows,
      timestamp: new Date().toISOString(),
      note: 'Este endpoint es público y no requiere autenticación'
    });
  } catch (error) {
    console.error('Error en test-leads:', error);
    res.status(500).json({ 
      error: 'Error al obtener información de leads', 
      details: String(error)
    });
  }
});

// Endpoint de prueba para leads con autenticación pero sin verificación de permisos
app.get('/test-leads-auth', async (req, res) => {
  try {
    // Obtener el encabezado de autorización
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({ message: 'Autenticación requerida' });
      return;
    }
    
    // Verificar el formato del encabezado
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({ message: 'Formato de autenticación inválido' });
      return;
    }
    
    const token = parts[1];
    
    try {
      // Verificar el token sin verificar permisos
      const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
      
      // Si llegamos aquí, el token es válido
      console.log(`Usuario ${decoded.email} con rol ${decoded.role} accediendo a /test-leads-auth`);
      
      // Obtener datos de leads (igual que en /test-leads)
      const result = await pool.query('SELECT COUNT(*) FROM leads');
      const leadCount = result.rows[0].count;
      
      const sampleResult = await pool.query('SELECT id, name, email, type, status, created_at FROM leads LIMIT 5');
      
      res.status(200).json({
        message: 'Test de leads con autenticación exitoso',
        totalLeads: leadCount,
        sampleLeads: sampleResult.rows,
        user: {
          email: decoded.email,
          role: decoded.role,
          userId: decoded.userId
        },
        timestamp: new Date().toISOString(),
        note: 'Este endpoint requiere autenticación pero no verifica permisos'
      });
    } catch (error) {
      // Error al verificar el token
      if (error instanceof jwt.JsonWebTokenError) {
        res.status(401).json({ message: 'Token inválido' });
      } else if (error instanceof jwt.TokenExpiredError) {
        res.status(401).json({ message: 'Token expirado' });
      } else {
        res.status(500).json({ message: 'Error interno del servidor', error: String(error) });
      }
    }
  } catch (error) {
    console.error('Error en test-leads-auth:', error);
    res.status(500).json({ 
      error: 'Error al obtener información de leads', 
      details: String(error)
    });
  }
});

// Endpoint de prueba para verificar la autenticación y visualizar el token
app.get('/test-auth', (req, res) => {
  // Extraer el token de autorización
  const authHeader = req.headers.authorization;
  let tokenInfo: { present: boolean; value: string | null; prefix: string | null } = { 
    present: false, 
    value: null, 
    prefix: null 
  };
  
  if (authHeader) {
    const parts = authHeader.split(' ');
    if (parts.length === 2) {
      tokenInfo = {
        present: true,
        prefix: parts[0],  // Debería ser "Bearer"
        value: `${parts[1].substring(0, 10)}...` // Mostrar solo el inicio del token por seguridad
      };
      
      // Intentar decodificar el token sin verificar firma
      try {
        const decoded = jwt.decode(parts[1]);
        console.log('Token decodificado:', decoded);
        
        res.status(200).json({ 
          message: 'Test de autenticación exitoso con decodificación',
          authHeader: 'presente',
          tokenInfo,
          decodedToken: decoded,
          timestamp: new Date().toISOString()
        });
        return;
      } catch (error) {
        console.error('Error al decodificar token:', error);
      }
    }
  }
  
  res.status(200).json({ 
    message: 'Test de autenticación',
    authHeader: req.headers.authorization ? 'presente' : 'ausente',
    tokenInfo,
    allHeaders: req.headers,
    timestamp: new Date().toISOString(),
    note: 'Este endpoint muestra información sobre los encabezados de autenticación enviados'
  });
});

// Endpoint especial para buscar al usuario Kojima
app.get('/test-kojima', async (req, res) => {
  try {
    // Buscar al usuario Kojima
    const result = await pool.query('SELECT * FROM users WHERE name ILIKE $1', ['%Kojima%']);
    
    if (result.rows.length > 0) {
      // Ocultar la contraseña por seguridad
      const users = result.rows.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json({ 
        success: true, 
        message: 'Encontrado(s) usuario(s) Kojima', 
        users
      });
    } else {
      res.json({ 
        success: false, 
        message: 'No se encontró ningún usuario con nombre similar a Kojima'
      });
    }
  } catch (error) {
    console.error('Error al buscar usuario Kojima:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al buscar usuario', 
      error: String(error)
    });
  }
});

// Endpoint de prueba para autenticación básica sin middlewares
app.get('/test-auth-basic', (req, res) => {
  // Obtener el encabezado de autorización
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    res.status(401).json({ message: 'Autenticación requerida' });
    return;
  }
  
  // Verificar el formato del encabezado
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    res.status(401).json({ message: 'Formato de autenticación inválido' });
    return;
  }
  
  const token = parts[1];
  
  try {
    // Verificar el token con el secreto
    const decoded = jwt.verify(token, config.jwtSecret as jwt.Secret) as JwtPayload;
    
    // Si llegamos aquí, el token es válido
    res.status(200).json({
      message: 'Autenticación exitosa',
      user: {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      console.error('Token inválido:', error.message);
      res.status(401).json({ message: 'Token inválido', error: error.message });
    } else if (error instanceof jwt.TokenExpiredError) {
      console.error('Token expirado:', error.message);
      res.status(401).json({ message: 'Token expirado', error: error.message });
    } else {
      console.error('Error en verificación:', error);
      res.status(500).json({ 
        message: 'Error interno del servidor durante la autenticación',
        error: String(error)
      });
    }
  }
});

// Endpoint para listar todos los usuarios (solo para propósitos de depuración)
app.get('/list-users', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, email, name, role, created_at FROM users ORDER BY id');
    
    res.json({ 
      success: true, 
      message: `Se encontraron ${result.rows.length} usuarios`, 
      users: result.rows
    });
  } catch (error) {
    console.error('Error al listar usuarios:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al listar usuarios', 
      error: String(error)
    });
  }
});

// Ruta principal para API
app.get('/', (req, res) => {
  res.json({
    message: "API Backend para la aplicación de rutas comerciales",
    version: "1.0.0",
    endpoints: [
      "/register - Registro de usuario",
      "/login - Inicio de sesión", 
      "/me - Perfil del usuario (requiere autenticación)",
      "/notifications - Gestión de notificaciones (requiere autenticación)",
      "/notifications/register-token - Registrar token FCM (requiere autenticación)",
      "/notifications/:id/read - Marcar notificación como leída (requiere autenticación)"
    ]
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

// Inicializar el programador de recordatorios
const reminderScheduler = new ReminderScheduler();
reminderScheduler.start();

export default app;
