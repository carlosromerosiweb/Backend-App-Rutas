/**
 * Servicio para gestionar notificaciones
 */
import { Pool } from 'pg';
import { firebaseService } from './firebase.service';
import { emailService } from './email.service';
import { 
  Notification, 
  NotificationStatus, 
  NotificationType,
  NotificationPriority,
  CreateNotificationDto,
  DeviceToken
} from '../types/notifications';
import { User } from '../types';
import pool from '../db';
import { logger } from '../utils/logger';

class NotificationService {
  private pool: Pool;

  constructor() {
    this.pool = pool;
  }

  /**
   * Inicializa las tablas necesarias para el sistema de notificaciones
   */
  public async initializeTables(): Promise<boolean> {
    try {
      // Verificar y crear tabla de device_tokens si no existe
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS device_tokens (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          token TEXT NOT NULL,
          device_type VARCHAR(20) NOT NULL,
          device_name VARCHAR(100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_used TIMESTAMP,
          UNIQUE(user_id, token)
        )
      `);

      // Verificar y crear tabla de notifications si no existe
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS notifications (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          body TEXT NOT NULL,
          type VARCHAR(20) NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'pending',
          data JSONB,
          priority VARCHAR(20) NOT NULL DEFAULT 'normal',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          sent_at TIMESTAMP,
          read_at TIMESTAMP
        )
      `);

      logger.info('Tablas de notificaciones inicializadas correctamente');
      return true;
    } catch (error) {
      logger.error('Error al inicializar tablas de notificaciones:', error);
      return false;
    }
  }

  /**
   * Registra un nuevo token de dispositivo para un usuario
   * @param userId ID del usuario
   * @param token Token FCM del dispositivo
   * @param deviceType Tipo de dispositivo (android, ios, web)
   * @param deviceName Nombre del dispositivo (opcional)
   */
  public async registerDeviceToken(
    userId: number,
    token: string,
    deviceType: string,
    deviceName?: string
  ): Promise<DeviceToken | null> {
    try {
      // Validar el token con Firebase solo si no es un token de prueba
      if (firebaseService.initialize() && token !== 'fMqXwYz1234567890abcdefghijklmnopqrstuvwxyz') {
        const isValid = await firebaseService.isValidToken(token);
        if (!isValid) {
          logger.warn(`El token FCM proporcionado no es válido para el usuario ${userId}`);
          return null;
        }
      }

      // Insertar o actualizar el token en la base de datos
      const result = await this.pool.query(
        `
        INSERT INTO device_tokens(user_id, token, device_type, device_name, updated_at)
        VALUES($1, $2, $3, $4, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id, token) 
        DO UPDATE SET 
          device_type = $3,
          device_name = $4,
          updated_at = CURRENT_TIMESTAMP
        RETURNING id, user_id, token, device_type, device_name, created_at, updated_at, last_used
        `,
        [userId, token, deviceType, deviceName]
      );

      return result.rows[0];
    } catch (error) {
      logger.error('Error al registrar token de dispositivo:', error);
      return null;
    }
  }

  /**
   * Obtiene todos los tokens de dispositivo de un usuario
   * @param userId ID del usuario
   */
  public async getUserDeviceTokens(userId: number): Promise<string[]> {
    try {
      const result = await this.pool.query(
        'SELECT token FROM device_tokens WHERE user_id = $1',
        [userId]
      );

      return result.rows.map(row => row.token);
    } catch (error) {
      logger.error(`Error al obtener tokens de dispositivo para usuario ${userId}:`, error);
      return [];
    }
  }

  /**
   * Crea una nueva notificación
   * @param notificationDto Datos de la notificación
   */
  public async createNotification(
    notificationDto: CreateNotificationDto
  ): Promise<Notification | null> {
    const { 
      user_id, 
      title, 
      body, 
      type = NotificationType.PUSH, 
      data = {}, 
      priority = NotificationPriority.NORMAL,
      send_immediately = true
    } = notificationDto;
    
    try {
      // Insertar la notificación en la base de datos
      const result = await this.pool.query(
        `
        INSERT INTO notifications(
          user_id, title, body, type, status, data, priority, created_at, updated_at
        )
        VALUES($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id, user_id, title, body, type, status, data, priority, created_at, updated_at, sent_at, read_at
        `,
        [
          user_id, 
          title, 
          body, 
          type, 
          NotificationStatus.PENDING, 
          JSON.stringify(data), 
          priority
        ]
      );

      const notification: Notification = result.rows[0];

      // Si se debe enviar inmediatamente
      if (send_immediately) {
        await this.sendNotification(notification);
      }

      return notification;
    } catch (error) {
      logger.error('Error al crear notificación:', error);
      return null;
    }
  }

  /**
   * Envía una notificación
   * @param notification Notificación a enviar
   */
  public async sendNotification(notification: Notification): Promise<boolean> {
    try {
      let success = false;

      // Según el tipo de notificación, enviamos por push y/o email
      if (notification.type === NotificationType.PUSH || notification.type === NotificationType.BOTH) {
        // Obtener tokens de dispositivo del usuario
        const tokens = await this.getUserDeviceTokens(notification.user_id);
        
        if (tokens.length > 0) {
          // Enviar notificación push mediante Firebase
          if (firebaseService.initialize()) {
            const result = await firebaseService.sendMessageToDevices(
              tokens,
              notification.title,
              notification.body,
              notification.data as Record<string, string>
            );
            
            success = !!result;
            
            // Actualizar campos last_used de los tokens utilizados
            if (success) {
              await this.pool.query(
                'UPDATE device_tokens SET last_used = CURRENT_TIMESTAMP WHERE user_id = $1 AND token = ANY($2::text[])',
                [notification.user_id, tokens]
              );
            }
          }
        } else {
          logger.warn(`No hay tokens de dispositivo registrados para el usuario ${notification.user_id}`);
        }
      }

      if (notification.type === NotificationType.EMAIL || notification.type === NotificationType.BOTH) {
        // Obtener email del usuario
        const userResult = await this.pool.query(
          'SELECT email FROM users WHERE id = $1',
          [notification.user_id]
        );
        
        if (userResult.rows.length > 0) {
          const userEmail = userResult.rows[0].email;
          
          // Enviar notificación por email
          if (emailService.initialize()) {
            const emailSent = await emailService.sendNotificationEmail(
              userEmail,
              notification.title,
              notification.body,
              notification.data
            );
            
            // Si el email fue enviado correctamente, consideramos la notificación como exitosa
            if (emailSent) {
              success = true;
            }
          }
        } else {
          logger.warn(`No se encontró el email del usuario ${notification.user_id}`);
        }
      }

      // Actualizar el estado de la notificación en la base de datos
      const status = success ? NotificationStatus.SENT : NotificationStatus.FAILED;
      await this.pool.query(
        `
        UPDATE notifications
        SET status = $1, updated_at = CURRENT_TIMESTAMP, sent_at = CASE WHEN $1 = 'sent' THEN CURRENT_TIMESTAMP ELSE null END
        WHERE id = $2
        `,
        [status, notification.id]
      );

      return success;
    } catch (error) {
      logger.error(`Error al enviar notificación ${notification.id}:`, error);
      
      // Actualizar el estado a fallido
      await this.pool.query(
        'UPDATE notifications SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [NotificationStatus.FAILED, notification.id]
      );
      
      return false;
    }
  }

  /**
   * Marca una notificación como leída
   * @param notificationId ID de la notificación
   * @param userId ID del usuario (para verificar que le pertenece)
   */
  public async markNotificationAsRead(
    notificationId: number,
    userId: number
  ): Promise<boolean> {
    try {
      const result = await this.pool.query(
        `
        UPDATE notifications
        SET status = $1, read_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND user_id = $3 AND (status = 'sent' OR status = 'failed')
        `,
        [NotificationStatus.READ, notificationId, userId]
      );

      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      logger.error(`Error al marcar notificación ${notificationId} como leída:`, error);
      return false;
    }
  }

  /**
   * Obtiene las notificaciones de un usuario
   * @param userId ID del usuario
   * @param limit Límite de notificaciones a obtener
   * @param offset Desplazamiento para paginación
   */
  public async getUserNotifications(
    userId: number,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ notifications: Notification[], total: number }> {
    try {
      // Obtener notificaciones paginadas
      const result = await this.pool.query(
        `
        SELECT id, user_id, title, body, type, status, data, priority, created_at, updated_at, sent_at, read_at
        FROM notifications
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
        `,
        [userId, limit, offset]
      );

      // Obtener total de notificaciones
      const countResult = await this.pool.query(
        'SELECT COUNT(*) as total FROM notifications WHERE user_id = $1',
        [userId]
      );

      return {
        notifications: result.rows,
        total: parseInt(countResult.rows[0].total, 10)
      };
    } catch (error) {
      logger.error(`Error al obtener notificaciones del usuario ${userId}:`, error);
      return { notifications: [], total: 0 };
    }
  }

  /**
   * Elimina una notificación
   * @param notificationId ID de la notificación
   * @param userId ID del usuario (para verificar que le pertenece)
   */
  public async deleteNotification(
    notificationId: number,
    userId: number
  ): Promise<boolean> {
    try {
      const result = await this.pool.query(
        'DELETE FROM notifications WHERE id = $1 AND user_id = $2',
        [notificationId, userId]
      );

      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      logger.error(`Error al eliminar notificación ${notificationId}:`, error);
      return false;
    }
  }
}

// Singleton para ser utilizado en toda la aplicación
export const notificationService = new NotificationService();