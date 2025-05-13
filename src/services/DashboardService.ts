import pool from '../db';
import { DashboardOverview } from '../types/dashboard';

export class DashboardService {
  async getOverview(userId: number): Promise<DashboardOverview> {
    try {
      // Obtener total de leads
      const totalLeadsResult = await pool.query('SELECT COUNT(*) FROM leads');
      const totalLeads = parseInt(totalLeadsResult.rows[0].count);
      
      // Leads por estado
      const leadsByStatusResult = await pool.query(
        'SELECT status, COUNT(*) FROM leads GROUP BY status'
      );
      const leadsByStatus = leadsByStatusResult.rows.map(row => ({
        status: row.status,
        count: parseInt(row.count)
      }));

      // Total de check-ins
      const totalCheckinsResult = await pool.query('SELECT COUNT(*) FROM checkins');
      const totalCheckins = parseInt(totalCheckinsResult.rows[0].count);

      // Check-ins últimos 30 días
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const checkinsByDayResult = await pool.query(
        `SELECT DATE(timestamp) as date, COUNT(*) 
         FROM checkins 
         WHERE timestamp >= $1 
         GROUP BY DATE(timestamp) 
         ORDER BY DATE(timestamp) DESC`,
        [thirtyDaysAgo]
      );
      const checkinsByDay = checkinsByDayResult.rows.map(row => ({
        date: row.date,
        count: parseInt(row.count)
      }));

      // Usuarios por rol
      const usersByRoleResult = await pool.query(
        'SELECT role, COUNT(*) FROM users GROUP BY role'
      );
      const usersByRole = usersByRoleResult.rows.map(row => ({
        role: row.role,
        count: parseInt(row.count)
      }));

      // Leads ganados y perdidos
      const leadsWonResult = await pool.query(
        "SELECT COUNT(*) FROM leads WHERE status = 'ganado'"
      );
      const leadsWon = parseInt(leadsWonResult.rows[0].count);

      const leadsLostResult = await pool.query(
        "SELECT COUNT(*) FROM leads WHERE status = 'perdido'"
      );
      const leadsLost = parseInt(leadsLostResult.rows[0].count);

      // Check-ins por ciudad
      const checkinsByCityResult = await pool.query(
        `SELECT l.city, COUNT(*) 
         FROM checkins c 
         LEFT JOIN leads l ON c.lead_id = l.id 
         GROUP BY l.city`
      );
      const checkinsByCity = checkinsByCityResult.rows.map(row => ({
        city: row.city,
        count: parseInt(row.count)
      }));

      // Estimación de km recorridos
      const totalDistanceResult = await pool.query(
        'SELECT SUM(distance) as total FROM checkins'
      );
      const totalDistance = parseFloat(totalDistanceResult.rows[0].total || '0');

      // Leads con próximo seguimiento pendiente
      const pendingFollowupsResult = await pool.query(
        'SELECT COUNT(*) FROM leads WHERE next_followup > NOW()'
      );
      const pendingFollowups = parseInt(pendingFollowupsResult.rows[0].count);

      // Leads sin interacción en 30 días (usando lead_interactions)
      const inactiveLeadsResult = await pool.query(
        `SELECT COUNT(DISTINCT l.id) 
         FROM leads l 
         LEFT JOIN lead_interactions li ON l.id = li.lead_id 
         WHERE l.status = 'activo' 
         AND (li.date IS NULL OR li.date <= $1)`,
        [thirtyDaysAgo]
      );
      const inactiveLeads = parseInt(inactiveLeadsResult.rows[0].count);

      // Registrar en system_logs
      await pool.query(
        'INSERT INTO system_logs (user_id, action, entity, message, status) VALUES ($1, $2, $3, $4, $5)',
        [userId, 'dashboard_overview', 'dashboard', 'Dashboard overview accessed', 'success']
      );

      return {
        leads_summary: {
          total: totalLeads,
          by_status: leadsByStatus,
          won: leadsWon,
          lost: leadsLost,
          conversion_rate: totalLeads > 0 
            ? (leadsWon / totalLeads) * 100 
            : 0,
          pending_followups: pendingFollowups,
          inactive: inactiveLeads
        },
        checkins_summary: {
          total: totalCheckins,
          by_day: checkinsByDay,
          by_city: checkinsByCity,
          total_distance: totalDistance,
          estimated_cost: totalDistance * 0.5 // Coste estimado por km
        },
        users_summary: {
          by_role: usersByRole
        },
        activity_summary: {
          last_30_days: {
            checkins: checkinsByDay.length,
            new_leads: totalLeads // Aquí podríamos filtrar por fecha si es necesario
          }
        }
      };
    } catch (error) {
      console.error('Error in getOverview:', error);
      throw new Error('Error al obtener el resumen del dashboard');
    }
  }
} 