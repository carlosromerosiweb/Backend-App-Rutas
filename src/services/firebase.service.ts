/**
 * Servicio para gestionar la integración con Firebase
 */
import * as admin from 'firebase-admin';
import { firebaseConfig, isFirebaseConfigValid } from '../config/firebase.config';
import { logger } from '../utils/logger';

class FirebaseService {
  private app: admin.app.App | null = null;
  private initialized = false;

  /**
   * Inicializa la conexión con Firebase utilizando las credenciales
   * del archivo JSON de cuenta de servicio o variables de entorno
   */
  public initialize(): boolean {
    if (this.initialized) {
      return true;
    }

    try {
      // Verificar si la configuración es válida
      if (!isFirebaseConfigValid()) {
        logger.warn('La configuración de Firebase no es válida o está incompleta. Algunas funcionalidades pueden no estar disponibles.');
        return false;
      }

      // Verificar si ya existe una instancia de Firebase
      if (admin.apps.length > 0) {
        this.app = admin.app();
        this.initialized = true;
        logger.info('Usando instancia existente de Firebase');
        return true;
      }

      // Inicializar Firebase Admin SDK con credenciales
      this.app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: firebaseConfig.projectId,
          privateKey: firebaseConfig.privateKey,
          clientEmail: firebaseConfig.clientEmail,
        }),
        databaseURL: firebaseConfig.databaseURL
      });

      this.initialized = true;
      logger.info('Firebase inicializado correctamente');
      return true;
    } catch (error) {
      logger.error('Error al inicializar Firebase:', error);
      return false;
    }
  }

  /**
   * Obtiene la instancia de la aplicación de Firebase
   */
  public getApp(): admin.app.App {
    if (!this.app) {
      if (!this.initialize()) {
        throw new Error('Firebase no ha sido inicializado correctamente');
      }
    }
    return this.app!;
  }

  /**
   * Obtiene la instancia de Firebase Messaging
   */
  public getMessaging(): admin.messaging.Messaging {
    return this.getApp().messaging();
  }

  /**
   * Envía un mensaje a un dispositivo específico
   * @param token Token FCM del dispositivo
   * @param title Título de la notificación
   * @param body Cuerpo de la notificación
   * @param data Datos adicionales (opcional)
   */
  public async sendMessageToDevice(
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>
  ): Promise<string | null> {
    if (!this.initialized) {
      if (!this.initialize()) {
        logger.error('No se pudo inicializar Firebase para enviar mensaje');
        return null;
      }
    }
    
    try {
      const message: admin.messaging.Message = {
        token,
        notification: {
          title,
          body
        },
        data: data || {}
      };
      
      // send ahora devuelve una cadena con el ID del mensaje
      return await this.getMessaging().send(message);
    } catch (error) {
      logger.error('Error al enviar mensaje a dispositivo:', error);
      return null;
    }
  }

  /**
   * Envía un mensaje a múltiples dispositivos
   * @param tokens Lista de tokens FCM de dispositivos
   * @param title Título de la notificación
   * @param body Cuerpo de la notificación
   * @param data Datos adicionales (opcional)
   */
  public async sendMessageToDevices(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>
  ): Promise<admin.messaging.BatchResponse | null> {
    if (!this.initialized) {
      if (!this.initialize()) {
        logger.error('No se pudo inicializar Firebase para enviar mensaje');
        return null;
      }
    }
    
    try {
      // Crear mensajes para cada token
      const messages: admin.messaging.Message[] = tokens.map(token => ({
        token,
        notification: {
          title,
          body
        },
        data: data || {}
      }));
      
      // Enviar todos los mensajes en un lote
      // sendAll no está disponible, enviamos cada mensaje individualmente
      const results = await Promise.all(
        messages.map(message => this.getMessaging().send(message))
      );
      
      // Crear una respuesta equivalente a BatchResponse
      return {
        responses: results.map(messageId => ({ 
          success: !!messageId, 
          messageId: messageId || undefined
        })),
        successCount: results.filter(Boolean).length,
        failureCount: results.filter(id => !id).length
      };
    } catch (error) {
      logger.error('Error al enviar mensaje a múltiples dispositivos:', error);
      return null;
    }
  }

  /**
   * Valida si un token FCM es válido
   * @param token Token FCM a validar
   * @returns Booleano indicando si el token es válido
   */
  public async isValidToken(token: string): Promise<boolean> {
    try {
      // Intentamos enviar un mensaje de test para validar el token
      const message: admin.messaging.Message = {
        token,
        data: { validationOnly: 'true' }
      };
      
      const result = await this.getMessaging().send(message, true); // dryRun = true no envía realmente el mensaje
      return !!result;
    } catch (error) {
      // Si hay un error, el token no es válido
      logger.error('Error al validar token FCM:', error);
      return false;
    }
  }

  /**
   * Genera un token de prueba para desarrollo
   * @returns Token FCM de prueba
   */
  public async generateTestToken(): Promise<string | null> {
    try {
      if (!this.initialized) {
        if (!this.initialize()) {
          logger.error('No se pudo inicializar Firebase para generar token de prueba');
          return null;
        }
      }

      // Crear un token de prueba usando el SDK de Admin
      const response = await this.getMessaging().subscribeToTopic(
        ['test-topic'],
        'test-device'
      );

      // Generar un token de prueba fijo para desarrollo
      return 'fMqXwYz1234567890abcdefghijklmnopqrstuvwxyz';
    } catch (error) {
      logger.error('Error al generar token de prueba:', error);
      return null;
    }
  }
}

// Singleton para ser utilizado en toda la aplicación
export const firebaseService = new FirebaseService();