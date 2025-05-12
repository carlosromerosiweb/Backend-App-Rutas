import { Request } from 'express';
import { JwtPayload } from './index';

export enum NotificationType {
  PUSH = 'PUSH',
  EMAIL = 'EMAIL',
  BOTH = 'BOTH'
}

export enum NotificationPriority {
  HIGH = 'high',
  NORMAL = 'normal',
  LOW = 'low'
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
  READ = 'read'
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  body: string;
  type: NotificationType;
  status: NotificationStatus;
  data?: Record<string, any>;
  priority: NotificationPriority;
  created_at: Date;
  updated_at: Date;
  sent_at?: Date;
  read_at?: Date;
}

export interface DeviceToken {
  id: number;
  user_id: number;
  token: string;
  device_type: string;
  device_name?: string;
  created_at: Date;
  updated_at: Date;
  last_used_at?: Date;
}

export interface NotificationPayload {
  title: string;
  body: string;
  userId?: number;
}

export interface NotificationRecord {
  id: number;
  user_id: number | null;
  title: string;
  body: string;
  sent_at: Date;
  sent_by: number;
  is_broadcast: boolean;
}

export interface NotificationRequest extends Request {
  body: NotificationPayload;
  user?: JwtPayload;
}

export interface RegisterDeviceTokenDto {
  token: string;
  device_type: string;
  device_name?: string;
}

export interface CreateNotificationDto {
  user_id: number;
  title: string;
  body: string;
  type?: NotificationType;
  data?: Record<string, any>;
  priority?: NotificationPriority;
  send_immediately?: boolean;
} 