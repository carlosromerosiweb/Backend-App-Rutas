import { Request, Response } from 'express';
import { userService } from '../services/user.service';
import { logger } from '../utils/logger';

/**
 * Obtiene todos los usuarios con paginación
 */
export const getUsers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await userService.getUsers(page, limit);

    res.json({
      success: true,
      data: result.users,
      pagination: {
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit)
      }
    });
  } catch (error) {
    logger.error('Error en getUsers:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los usuarios'
    });
  }
};

/**
 * Obtiene un usuario específico por su ID
 */
export const getUserById = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      res.status(400).json({
        success: false,
        message: 'ID de usuario inválido'
      });
      return;
    }

    const result = await userService.getUserById(userId);

    if (!result) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
      return;
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error en getUserById:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el usuario'
    });
  }
};

/**
 * Elimina un usuario específico por su ID
 */
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      res.status(400).json({
        success: false,
        message: 'ID de usuario inválido'
      });
      return;
    }

    // Verificar que el usuario que intenta eliminar no sea el mismo
    const currentUserId = parseInt(req.user?.id as string);
    if (userId === currentUserId) {
      res.status(400).json({
        success: false,
        message: 'No puedes eliminar tu propio usuario'
      });
      return;
    }

    const result = await userService.deleteUser(userId);

    if (!result) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    });
  } catch (error) {
    logger.error('Error en deleteUser:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el usuario'
    });
  }
};

/**
 * Actualiza el rol de un usuario
 */
export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const { role } = req.body;
    
    if (isNaN(userId)) {
      res.status(400).json({
        success: false,
        message: 'ID de usuario inválido'
      });
      return;
    }

    // Validar que el rol sea uno de los permitidos
    const validRoles = ['comercial', 'manager'];
    if (!role || !validRoles.includes(role)) {
      res.status(400).json({
        success: false,
        message: 'Rol no válido. Los roles permitidos son: comercial, manager'
      });
      return;
    }

    // Verificar que el usuario que intenta modificar no sea el mismo
    const currentUserId = parseInt(req.user?.id as string);
    if (userId === currentUserId) {
      res.status(400).json({
        success: false,
        message: 'No puedes modificar tu propio rol'
      });
      return;
    }

    // Verificar que el usuario a modificar no sea admin
    const targetUser = await userService.getUserById(userId);
    if (!targetUser) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
      return;
    }

    if (targetUser.role === 'admin') {
      res.status(403).json({
        success: false,
        message: 'No puedes modificar el rol de un administrador'
      });
      return;
    }

    const result = await userService.updateUserRole(userId, role);

    if (!result) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Rol de usuario actualizado exitosamente',
      user: result
    });
  } catch (error) {
    logger.error('Error en updateUserRole:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el rol del usuario'
    });
  }
}; 