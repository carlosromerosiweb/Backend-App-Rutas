/**
 * Servicio para el envío de correos electrónicos
 */
import nodemailer from 'nodemailer';
import { firebaseConfig, isEmailConfigValid } from '../config/firebase.config';
import { logger } from '../utils/logger';

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private initialized = false;

  /**
   * Inicializa el transporter de nodemailer con la configuración SMTP
   */
  public initialize(): boolean {
    if (this.initialized) {
      return true;
    }

    try {
      // Verificar si la configuración de email es válida
      if (!isEmailConfigValid()) {
        logger.warn('La configuración de email no es válida o está incompleta. La funcionalidad de correos no estará disponible.');
        return false;
      }

      // Crear el transporter con la configuración SMTP
      this.transporter = nodemailer.createTransport({
        host: firebaseConfig.email.host,
        port: firebaseConfig.email.port,
        secure: firebaseConfig.email.secure,
        auth: {
          user: firebaseConfig.email.auth.user,
          pass: firebaseConfig.email.auth.pass,
        },
      });

      this.initialized = true;
      logger.info('Servicio de correo electrónico inicializado correctamente');
      return true;
    } catch (error) {
      logger.error('Error al inicializar el servicio de correo electrónico:', error);
      return false;
    }
  }

  /**
   * Obtiene el transporter de nodemailer
   */
  private getTransporter(): nodemailer.Transporter {
    if (!this.transporter) {
      if (!this.initialize()) {
        throw new Error('El servicio de correo electrónico no ha sido inicializado correctamente');
      }
    }
    return this.transporter!;
  }

  /**
   * Verifica la conexión con el servidor SMTP
   */
  public async verifyConnection(): Promise<boolean> {
    try {
      await this.getTransporter().verify();
      return true;
    } catch (error) {
      logger.error('Error al verificar la conexión con el servidor SMTP:', error);
      return false;
    }
  }

  /**
   * Envía un correo electrónico
   * @param to Destinatario(s)
   * @param subject Asunto del correo
   * @param text Contenido en texto plano
   * @param html Contenido en HTML (opcional)
   */
  public async sendEmail(
    to: string | string[],
    subject: string,
    text: string,
    html?: string
  ): Promise<boolean> {
    if (!this.initialized) {
      if (!this.initialize()) {
        logger.error('No se pudo inicializar el servicio de correo electrónico para enviar correo');
        return false;
      }
    }

    try {
      const info = await this.getTransporter().sendMail({
        from: firebaseConfig.email.sender,
        to: typeof to === 'string' ? to : to.join(', '),
        subject,
        text,
        html: html || text,
      });

      logger.info(`Correo electrónico enviado: ${info.messageId}`);
      return true;
    } catch (error) {
      logger.error('Error al enviar correo electrónico:', error);
      return false;
    }
  }

  /**
   * Envía una notificación por correo electrónico
   * @param to Destinatario(s)
   * @param title Título de la notificación (asunto)
   * @param body Cuerpo de la notificación
   * @param data Datos adicionales (opcional)
   */
  public async sendNotificationEmail(
    to: string | string[],
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<boolean> {
    // Generar HTML básico para la notificación
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f8f9fa; padding: 10px; border-bottom: 1px solid #dee2e6; }
          .content { padding: 20px 0; }
          .footer { font-size: 12px; color: #6c757d; padding-top: 20px; border-top: 1px solid #dee2e6; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>${title}</h2>
          </div>
          <div class="content">
            <p>${body}</p>
            ${data ? `<pre>${JSON.stringify(data, null, 2)}</pre>` : ''}
          </div>
          <div class="footer">
            <p>Esta es una notificación automática del sistema de Ruta Comercial.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(to, title, body, html);
  }
}

// Singleton para ser utilizado en toda la aplicación
export const emailService = new EmailService();