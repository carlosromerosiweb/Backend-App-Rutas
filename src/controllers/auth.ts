import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import pool from '../db';
import { config } from '../config';
import { RegisterUserDto, LoginUserDto, User, JwtPayload, AuthResponse, ChangePasswordDto } from '../types';
import { logger } from '../utils/logger';

/**
 * Register a new user
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  const { email, password, name, role = 'comercial' }: RegisterUserDto = req.body;

  try {
    // Validate input
    if (!email || !password || !name) {
      res.status(400).json({ message: 'Email, contraseña y nombre son obligatorios' });
      return;
    }
    
    // Validar que el rol sea uno de los permitidos
    const validRoles = ['comercial', 'manager', 'admin'];
    if (role && !validRoles.includes(role)) {
      res.status(400).json({ 
        message: 'Rol no válido. Los roles permitidos son: comercial, manager, admin' 
      });
      return;
    }

    // Check if email already exists
    console.log('Verificando si el email ya existe:', email);
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      console.log('El email ya está en uso');
      res.status(409).json({ message: 'Este email ya está en uso' });
      return;
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user
    console.log('Insertando nuevo usuario con rol:', role);
    const insertQuery = 'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role';
    console.log('Query de inserción:', insertQuery);
    
    const result = await pool.query(
      insertQuery,
      [email, hashedPassword, name, role]
    );
    
    if (result.rows.length === 0) {
      console.error('Error: No se pudo crear el usuario');
      res.status(500).json({ message: 'No se pudo completar el registro del usuario. Por favor, intente nuevamente o contacte al soporte técnico.' });
      return;
    }
    
    console.log('Usuario creado exitosamente');
    const newUser = result.rows[0];

    // Generate JWT
    const payload: JwtPayload = {
      id: newUser.id,
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role
    };

    const token = jwt.sign(
      payload, 
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn } as SignOptions
    );

    const response: AuthResponse = {
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role
      }
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Ocurrió un error durante el proceso de registro. Por favor, intente nuevamente o contacte al soporte técnico.' });
  }
};

/**
 * Login a user
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password }: LoginUserDto = req.body;

  try {
    // Validate input
    if (!email || !password) {
      res.status(400).json({ message: 'Email y contraseña son obligatorios' });
      return;
    }

    // Find user by email
    const result = await pool.query<User>(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    const user = result.rows[0];

    // Check if user exists
    if (!user) {
      res.status(401).json({ message: 'Credenciales inválidas' });
      return;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({ message: 'Credenciales inválidas' });
      return;
    }

    // Generate JWT
    const payload: JwtPayload = {
      id: user.id,
      userId: user.id,
      email: user.email,
      role: user.role
    };

    const token = jwt.sign(
      payload, 
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn } as SignOptions
    );

    // Update refresh token in database (optional)
    await pool.query(
      'UPDATE users SET refresh_token = $1 WHERE id = $2',
      [token, user.id]
    );

    const response: AuthResponse = {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error interno del servidor durante el inicio de sesión' });
  }
};

/**
 * Get current user info
 */
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    // El middleware de autenticación ya ha verificado el token y lo ha agregado a req.user
    const userId = req.user?.userId;
    
    if (!userId) {
      res.status(401).json({ message: 'No autorizado' });
      return;
    }

    // Obtener la información actualizada del usuario
    const result = await pool.query(
      'SELECT id, email, name, role FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    const user = result.rows[0];
    
    res.status(200).json({ user });
  } catch (error) {
    console.error('Error al obtener información del usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/**
 * Cambia la contraseña del usuario actual
 */
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  const { currentPassword, newPassword }: ChangePasswordDto = req.body;
  const userId = req.user?.userId;

  try {
    // Validar que el usuario esté autenticado
    if (!userId) {
      res.status(401).json({ message: 'No autorizado' });
      return;
    }

    // Validar datos de entrada
    if (!currentPassword || !newPassword) {
      res.status(400).json({ message: 'La contraseña actual y la nueva contraseña son obligatorias' });
      return;
    }

    // Obtener usuario actual
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );

    const user = result.rows[0];

    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    // Verificar contraseña actual
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      res.status(401).json({ message: 'La contraseña actual es incorrecta' });
      return;
    }

    // Hash de la nueva contraseña
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Actualizar contraseña
    await pool.query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [hashedNewPassword, userId]
    );

    // Generar nuevo token
    const payload: JwtPayload = {
      id: user.id,
      userId: user.id,
      email: user.email,
      role: user.role
    };

    const token = jwt.sign(
      payload, 
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn } as SignOptions
    );

    res.status(200).json({ 
      message: 'Contraseña actualizada exitosamente',
      token // Incluir el nuevo token en la respuesta
    });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({ message: 'Error interno del servidor al cambiar la contraseña' });
  }
};

/**
 * Realiza el logout del usuario
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      res.status(401).json({ message: 'No autorizado' });
      return;
    }

    // Limpiar el refresh token del usuario
    await pool.query(
      'UPDATE users SET refresh_token = NULL WHERE id = $1',
      [userId]
    );

    // Registrar el evento de logout
    logger.info('Usuario ha cerrado sesión', {
      userId,
      timestamp: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      message: 'Sesión cerrada exitosamente'
    });
  } catch (error) {
    logger.error('Error en logout:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cerrar sesión'
    });
  }
};
