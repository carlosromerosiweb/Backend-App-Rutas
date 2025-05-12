/**
 * Controladores para la gestión de notificaciones
 */
import { Request, Response } from 'express';
import { notificationService } from '../../services/notification.service';
import { 
  RegisterDeviceTokenDto, 
  CreateNotificationDto,
  NotificationType,
  NotificationPriority
} from '../../types/notifications';
import { JwtPayload } from '../../types';
import { logger } from '../../utils/logger';

/**
 * Registra un nuevo token de dispositivo para recibir notificaciones
 */
export const registerDeviceToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as JwtPayload;
    if (!user) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    const { token, device_type, device_name }: RegisterDeviceTokenDto = req.body;

    if (!token || !device_type) {
      res.status(400).json({ error: 'Se requiere token y tipo de dispositivo' });
      return;
    }

    const result = await notificationService.registerDeviceToken(
      parseInt(user.userId, 10),
      token,
      device_type,
      device_name
    );

    if (result) {
      res.status(201).json({ message: 'Token registrado correctamente', deviceToken: result });
    } else {
      res.status(400).json({ error: 'No se pudo registrar el token de dispositivo' });
    }
  } catch (error) {
    logger.error('Error al registrar token de dispositivo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/**
 * Obtiene las notificaciones del usuario actual
 */
export const getUserNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as JwtPayload;
    if (!user) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '20', 10);
    const offset = (page - 1) * limit;

    const { notifications, total } = await notificationService.getUserNotifications(
      parseInt(user.userId, 10),
      limit,
      offset
    );

    res.status(200).json({
      notifications,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error al obtener notificaciones del usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/**
 * Marca una notificación como leída
 */
export const markNotificationAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as JwtPayload;
    if (!user) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    const notificationId = parseInt(req.params.id, 10);
    if (isNaN(notificationId)) {
      res.status(400).json({ error: 'ID de notificación inválido' });
      return;
    }

    const result = await notificationService.markNotificationAsRead(
      notificationId,
      parseInt(user.userId, 10)
    );

    if (result) {
      res.status(200).json({ message: 'Notificación marcada como leída' });
    } else {
      res.status(404).json({ error: 'Notificación no encontrada o ya fue leída' });
    }
  } catch (error) {
    logger.error('Error al marcar notificación como leída:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/**
 * Elimina una notificación
 */
export const deleteNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as JwtPayload;
    if (!user) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    const notificationId = parseInt(req.params.id, 10);
    if (isNaN(notificationId)) {
      res.status(400).json({ error: 'ID de notificación inválido' });
      return;
    }

    const result = await notificationService.deleteNotification(
      notificationId,
      parseInt(user.userId, 10)
    );

    if (result) {
      res.status(200).json({ message: 'Notificación eliminada correctamente' });
    } else {
      res.status(404).json({ error: 'Notificación no encontrada' });
    }
  } catch (error) {
    logger.error('Error al eliminar notificación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/**
 * Crea una nueva notificación (admin/manager)
 */
export const createNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as JwtPayload;
    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      res.status(403).json({ error: 'No tiene permisos para crear notificaciones' });
      return;
    }

    const {
      user_id,
      title,
      body,
      type = NotificationType.PUSH,
      data,
      priority = NotificationPriority.NORMAL,
      send_immediately = true
    }: CreateNotificationDto = req.body;

    if (!user_id || !title || !body) {
      res.status(400).json({ error: 'Se requiere ID de usuario, título y cuerpo' });
      return;
    }

    const notification = await notificationService.createNotification({
      user_id,
      title,
      body,
      type,
      data,
      priority,
      send_immediately
    });

    if (notification) {
      res.status(201).json({ message: 'Notificación creada correctamente', notification });
    } else {
      res.status(400).json({ error: 'No se pudo crear la notificación' });
    }
  } catch (error) {
    logger.error('Error al crear notificación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/**
 * Endpoint para desarrollo que registra un token de prueba
 */
export const registerTestToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as JwtPayload;
    if (!user) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    // Token de prueba predefinido (solo para desarrollo)
    const testToken = 'fMqXwYz1234567890abcdefghijklmnopqrstuvwxyz';

    const result = await notificationService.registerDeviceToken(
      parseInt(user.userId, 10),
      testToken,
      'web',
      'Test Device'
    );

    if (result) {
      res.status(201).json({ 
        message: 'Token de prueba registrado correctamente', 
        deviceToken: result 
      });
    } else {
      res.status(400).json({ error: 'No se pudo registrar el token de prueba' });
    }
  } catch (error) {
    logger.error('Error al registrar token de prueba:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};