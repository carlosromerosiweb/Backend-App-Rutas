/**
 * Configuración de Firebase para Cloud Messaging
 */
import * as dotenv from 'dotenv';

dotenv.config();

export const firebaseConfig = {
  // Valores de configuración de Firebase
  projectId: process.env.FIREBASE_PROJECT_ID || '',
  privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : '',
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
  databaseURL: process.env.FIREBASE_DATABASE_URL || '',
  
  // Configuración para Cloud Messaging
  fcm: {
    enabled: process.env.FCM_ENABLED === 'true',
    serverKey: process.env.FCM_SERVER_KEY || ''
  },
  
  // Configuración para correos electrónicos
  email: {
    enabled: process.env.EMAIL_NOTIFICATIONS_ENABLED === 'true',
    sender: process.env.EMAIL_SENDER || 'notificaciones@ruta-comercial.com',
    host: process.env.EMAIL_HOST || '',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    auth: {
      user: process.env.EMAIL_USER || '',
      pass: process.env.EMAIL_PASSWORD || '',
    },
    secure: process.env.EMAIL_SECURE === 'true',
  }
};

// Validación básica de configuración para Firebase
export const isFirebaseConfigValid = (): boolean => {
  return !!(
    firebaseConfig.projectId &&
    firebaseConfig.privateKey &&
    firebaseConfig.clientEmail
  );
};

// Validación de configuración para FCM
export const isFcmConfigValid = (): boolean => {
  return firebaseConfig.fcm.enabled && !!firebaseConfig.fcm.serverKey;
};

// Validación de configuración para email
export const isEmailConfigValid = (): boolean => {
  return firebaseConfig.email.enabled && !!(
    firebaseConfig.email.host &&
    firebaseConfig.email.port &&
    firebaseConfig.email.auth.user &&
    firebaseConfig.email.auth.pass
  );
};