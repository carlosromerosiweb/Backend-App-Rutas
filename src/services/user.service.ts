import { Pool } from 'pg';
import pool from '../db';
import { logger } from '../utils/logger';
import { User } from '../types';

class UserService {
  private pool: Pool;

  constructor() {
    this.pool = pool;
  }

  /**
   * Obtiene todos los usuarios con paginación
   * @param page Número de página
   * @param limit Límite de resultados por página
   */
  public async getUsers(
    page: number = 1,
    limit: number = 20
  ): Promise<{ users: User[], total: number }> {
    try {
      // Calcular el offset para la paginación
      const offset = (page - 1) * limit;

      // Obtener el total de usuarios
      const countQuery = 'SELECT COUNT(*) FROM users';
      const countResult = await this.pool.query(countQuery);
      const total = parseInt(countResult.rows[0].count);

      // Obtener los usuarios paginados
      const query = `
        SELECT 
          id,
          name,
          role,
          email
        FROM users
        ORDER BY id DESC
        LIMIT $1 OFFSET $2
      `;

      const result = await this.pool.query(query, [limit, offset]);
      
      return {
        users: result.rows,
        total
      };
    } catch (error) {
      logger.error('Error al obtener usuarios:', error);
      return { users: [], total: 0 };
    }
  }
}

// Exportar una instancia única del servicio
export const userService = new UserService(); 