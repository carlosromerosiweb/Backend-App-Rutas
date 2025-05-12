import { Request, Response, RequestHandler } from 'express';
import pool from '../db';

export const getLogs: RequestHandler = async (req, res) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const offset = (page - 1) * limit;

        const result = await pool.query(
            `SELECT 
                l.*,
                u.name as user_name,
                u.email as user_email
            FROM system_logs l
            LEFT JOIN users u ON l.user_id = u.id
            ORDER BY l.timestamp DESC
            LIMIT $1 OFFSET $2`,
            [limit, offset]
        );

        const countResult = await pool.query('SELECT COUNT(*) FROM system_logs');
        const total = parseInt(countResult.rows[0].count);

        res.json({
            logs: result.rows,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error al obtener logs:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

export const getLogById: RequestHandler = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `SELECT 
                l.*,
                u.name as user_name,
                u.email as user_email
            FROM system_logs l
            LEFT JOIN users u ON l.user_id = u.id
            WHERE l.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Log no encontrado' });
            return;
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al obtener log:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

export const searchLogs: RequestHandler = async (req, res) => {
    try {
        const {
            action,
            userId,
            entity,
            status,
            from,
            to,
            page = 1,
            limit = 20
        } = req.query;

        let conditions = [];
        let params = [];
        let paramIndex = 1;

        if (action) {
            conditions.push(`l.action = $${paramIndex}`);
            params.push(action);
            paramIndex++;
        }

        if (userId) {
            conditions.push(`l.user_id = $${paramIndex}`);
            params.push(userId);
            paramIndex++;
        }

        if (entity) {
            conditions.push(`l.entity = $${paramIndex}`);
            params.push(entity);
            paramIndex++;
        }

        if (status) {
            conditions.push(`l.status = $${paramIndex}`);
            params.push(status);
            paramIndex++;
        }

        if (from) {
            conditions.push(`l.timestamp >= $${paramIndex}`);
            params.push(from);
            paramIndex++;
        }

        if (to) {
            conditions.push(`l.timestamp <= $${paramIndex}`);
            params.push(to);
            paramIndex++;
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const offset = (Number(page) - 1) * Number(limit);

        const result = await pool.query(
            `SELECT 
                l.*,
                u.name as user_name,
                u.email as user_email
            FROM system_logs l
            LEFT JOIN users u ON l.user_id = u.id
            ${whereClause}
            ORDER BY l.timestamp DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
            [...params, limit, offset]
        );

        const countResult = await pool.query(
            `SELECT COUNT(*) FROM system_logs l ${whereClause}`,
            params
        );

        const total = parseInt(countResult.rows[0].count);

        res.json({
            logs: result.rows,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit))
            }
        });
    } catch (error) {
        console.error('Error al buscar logs:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}; 