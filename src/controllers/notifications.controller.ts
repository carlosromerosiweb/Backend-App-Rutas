import { Response } from 'express';
import { messaging } from '../config/firebase';
import { NotificationRequest, NotificationRecord } from '../types/notifications';
import pool from '../db';
import { logger } from '../utils/logger';
import { isFirebaseConfigValid } from '../config/firebase.config';

export const sendNotification = async (req: NotificationRequest, res: Response): Promise<void> => {
  try {
    // Verificar configuración de Firebase
    if (!isFirebaseConfigValid()) {
      logger.error('Configuración de Firebase inválida');
      res.status(500).json({ error: 'Configuración de Firebase inválida' });
      return;
    }

    const { title, body, userId } = req.body;
    const senderId = req.user?.userId;

    if (!senderId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    if (!title || !body) {
      res.status(400).json({ error: 'Título y cuerpo son requeridos' });
      return;
    }

    let tokens: string[] = [];
    let isBroadcast = !userId;

    try {
      if (userId) {
        // Obtener token para un usuario específico
        const result = await pool.query(
          'SELECT fcm_token FROM users WHERE id = $1 AND fcm_token IS NOT NULL',
          [userId]
        );
        tokens = result.rows.map(row => row.fcm_token);
      } else {
        // Obtener tokens de todos los comerciales
        const result = await pool.query(
          'SELECT fcm_token FROM users WHERE role = $1 AND fcm_token IS NOT NULL',
          ['comercial']
        );
        tokens = result.rows.map(row => row.fcm_token);
      }
    } catch (dbError) {
      logger.error('Error al consultar tokens en la base de datos:', dbError);
      res.status(500).json({ error: 'Error al consultar tokens en la base de datos' });
      return;
    }

    if (tokens.length === 0) {
      res.status(404).json({ error: 'No se encontraron tokens FCM para enviar la notificación' });
      return;
    }

    // Enviar notificación a través de Firebase
    const messages = tokens.map(token => ({
      token,
      notification: {
        title,
        body
      }
    }));

    try {
      const response = await Promise.all(
        messages.map(message => messaging.send(message))
      );

      const results = {
        successCount: response.length,
        failureCount: 0
      };

      // Registrar la notificación en la base de datos
      const notificationRecord: NotificationRecord = {
        id: 0,
        user_id: userId || null,
        title,
        body,
        sent_at: new Date(),
        sent_by: parseInt(senderId),
        is_broadcast: isBroadcast
      };

      await pool.query(
        `INSERT INTO notifications 
         (user_id, title, body, sent_at, sent_by, is_broadcast)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [
          notificationRecord.user_id,
          notificationRecord.title,
          notificationRecord.body,
          notificationRecord.sent_at,
          notificationRecord.sent_by,
          notificationRecord.is_broadcast
        ]
      );

      res.status(200).json({
        success: true,
        message: 'Notificación enviada correctamente',
        results
      });
    } catch (firebaseError) {
      logger.error('Error al enviar notificación a Firebase:', firebaseError);
      res.status(500).json({ 
        error: 'Error al enviar la notificación',
        details: firebaseError instanceof Error ? firebaseError.message : 'Error desconocido'
      });
    }
  } catch (error) {
    logger.error('Error general al enviar notificación:', error);
    res.status(500).json({ 
      error: 'Error al enviar la notificación',
      message: 'No se pudo enviar la notificación. Por favor, intente nuevamente o contacte al soporte técnico.',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}; 