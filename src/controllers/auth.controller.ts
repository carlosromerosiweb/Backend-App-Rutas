import 'dotenv/config';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { supabase } from '../config/supabase';

// Inicializar cliente de Supabase
const supabaseClient = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

// Generar tokens
const generateTokens = (userId: string, role: string) => {
  const accessToken = jwt.sign(
    { userId, role },
    process.env.JWT_SECRET!,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

// Login
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Buscar usuario en Supabase
    const { data: user, error } = await supabaseClient
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Generar tokens
    const { accessToken, refreshToken } = generateTokens(user.id, user.role);

    // Guardar refresh token en la base de datos
    await supabaseClient
      .from('users')
      .update({ refresh_token: refreshToken })
      .eq('id', user.id);

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Registro
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    const role = 'comercial'; // Rol por defecto

    // Verificar si el email ya existe
    const { data: existingUser } = await supabaseClient
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario en Supabase
    const { data: user, error } = await supabaseClient
      .from('users')
      .insert([
        {
          email,
          password: hashedPassword,
          name,
          role
        }
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Generar tokens
    const { accessToken, refreshToken } = generateTokens(user.id, user.role);

    res.status(201).json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Refresh Token
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Token de refresco no proporcionado' });
    }

    // Verificar token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET!) as { userId: string };

    // Buscar usuario y verificar token
    const { data: user, error } = await supabaseClient
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .eq('refresh_token', refreshToken)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Token de refresco inválido' });
    }
    // Generar nuevos tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.id, user.role);

    // Actualizar refresh token en la base de datos
    await supabaseClient
      .from('users')
      .update({ refresh_token: newRefreshToken })
      .eq('id', user.id);

    res.json({
      accessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    console.error('Error en refresh token:', error);
    res.status(401).json({ error: 'Token de refresco inválido' });
  }
};

export const authController = {
  async register(req: Request, res: Response) {
    try {
      const { email, password, nombre } = req.body;
      const role = 'comercial'; // Rol por defecto

      // Verificar si el usuario ya existe
      const { data: existingUser } = await supabase
        .from('users')
        .select()
        .eq('email', email)
        .single();

      if (existingUser) {
        return res.status(400).json({ message: 'El usuario ya existe' });
      }

      // Hash de la contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      // Crear el usuario
      const { data: newUser, error } = await supabase
        .from('users')
        .insert([
          {
            email,
            password: hashedPassword,
            name: nombre,
            role
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // Generar token
      const token = jwt.sign(
        { id: newUser.id, email: newUser.email, role: newUser.role },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      res.status(201).json({
        message: 'Usuario registrado exitosamente',
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role
        }
      });
    } catch (error) {
      console.error('Error en registro:', error);
      res.status(500).json({ message: 'Error al registrar usuario' });
    }
  },

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      // Buscar usuario
      const { data: user, error } = await supabase
        .from('usuarios')
        .select()
        .eq('email', email)
        .single();

      if (error || !user) {
        return res.status(401).json({ message: 'Credenciales inválidas' });
      }

      // Verificar contraseña
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: 'Credenciales inválidas' });
      }

      // Generar token
      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      res.json({
        message: 'Login exitoso',
        token,
        user: {
          id: user.id,
          email: user.email,
          nombre: user.nombre
        }
      });
    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({ message: 'Error al iniciar sesión' });
    }
  },

  async getProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;

      const { data: user, error } = await supabase
        .from('usuarios')
        .select('id, email, nombre')
        .eq('id', userId)
        .single();

      if (error || !user) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      res.json(user);
    } catch (error) {
      console.error('Error al obtener perfil:', error);
      res.status(500).json({ message: 'Error al obtener perfil' });
    }
  }
}; 