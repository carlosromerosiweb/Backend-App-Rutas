/**
 * Tipos relacionados con el sistema de notificaciones
 */

// Estados posibles de una notificación
export enum NotificationStatus {
  PENDING = 'pending',     // Pendiente de envío
  SENT = 'sent',           // Enviada correctamente
  READ = 'read',           // Leída por el usuario
  FAILED = 'failed',       // Falló el envío
  CANCELLED = 'cancelled'  // Cancelada antes de enviarse
}

// Tipos de notificación según canal
export enum NotificationType {
  PUSH = 'push',           // Notificación push
  EMAIL = 'email',         // Correo electrónico
  BOTH = 'both'            // Ambos canales
}

// Prioridad de la notificación
export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high'
}

// Modelo principal de notificación
export interface Notification {
  id: number;
  user_id: number;         // ID del usuario destinatario
  title: string;           // Título de la notificación
  body: string;            // Cuerpo del mensaje
  type: NotificationType;  // Tipo de notificación
  status: NotificationStatus; // Estado actual
  data?: object;           // Datos adicionales en formato JSON
  priority: NotificationPriority; // Prioridad 
  created_at: Date;        // Fecha de creación
  updated_at: Date;        // Fecha de última actualización
  sent_at?: Date;          // Fecha de envío
  read_at?: Date;          // Fecha de lectura
}

// DTOs para endpoints

// DTO para crear una nueva notificación
export interface CreateNotificationDto {
  user_id: number;          // ID del usuario destinatario
  title: string;            // Título de la notificación
  body: string;             // Cuerpo del mensaje
  type: NotificationType;   // Tipo de notificación
  data?: object;            // Datos adicionales en formato JSON
  priority?: NotificationPriority; // Prioridad (opcional, por defecto NORMAL)
  send_immediately?: boolean; // Enviar inmediatamente o solo guardar
}

// DTO para actualizar el estado de una notificación
export interface UpdateNotificationStatusDto {
  status: NotificationStatus;
}

// DTO para registrar un token de dispositivo
export interface RegisterDeviceTokenDto {
  token: string;            // Token FCM del dispositivo
  device_type: string;      // android, ios, web
  device_name?: string;     // Nombre opcional del dispositivo
}

// DTO para enviar notificación a múltiples usuarios
export interface BulkNotificationDto extends Omit<CreateNotificationDto, 'user_id'> {
  user_ids: number[];      // Lista de IDs de usuarios destinatarios
}

// Estructura para tokens de dispositivo asociados a usuarios
export interface DeviceToken {
  id: number;
  user_id: number;         // ID del usuario
  token: string;           // Token FCM
  device_type: string;     // android, ios, web
  device_name?: string;    // Nombre del dispositivo (opcional)
  created_at: Date;        // Fecha de registro
  updated_at: Date;        // Fecha de última actualización
  last_used?: Date;        // Última vez que se usó para enviar
}