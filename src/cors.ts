import { Request, Response, NextFunction } from 'express';

// Middleware personalizado para configurar los encabezados CORS
export const corsMiddleware = (req: Request, res: Response, next: NextFunction): any => {
  // Encabezados CORS extremadamente permisivos
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, PUT, PATCH, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', '*'); // Permitir todos los encabezados
  res.header('Access-Control-Expose-Headers', '*'); // Exponer todos los encabezados
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400'); // 24 horas
  
  // Responder inmediatamente a las solicitudes OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    // Responder 200 OK en lugar de 204 No Content
    res.status(200).json({
      status: 'ok',
      cors: 'enabled',
      message: 'CORS preflight response'
    });
    return; // Importante: terminar la ejecución después de enviar la respuesta
  }
  
  // Registrar solicitudes para depuración
  console.log(`[CORS] Solicitud ${req.method} a ${req.path}`);
  
  next();
};
