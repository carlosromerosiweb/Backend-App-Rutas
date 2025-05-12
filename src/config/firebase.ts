import * as admin from 'firebase-admin';
import { logger } from '../utils/logger';
import { firebaseConfig } from './firebase.config';

// Inicializar Firebase Admin SDK
const initializeFirebase = (): admin.app.App => {
  try {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: firebaseConfig.projectId,
          privateKey: firebaseConfig.privateKey,
          clientEmail: firebaseConfig.clientEmail
        })
      });
      
      logger.info('Firebase Admin SDK inicializado correctamente');
    }
    
    return admin.app();
  } catch (error) {
    logger.error('Error al inicializar Firebase Admin SDK:', error);
    throw error;
  }
};

// Exportar instancia de Firebase Admin
export const firebaseAdmin = initializeFirebase();

// Exportar instancia de Firebase Messaging
export const messaging = firebaseAdmin.messaging(); 