export interface Badge {
  id: string;
  name: string;
  description: string;
  type: 'PERMANENT' | 'WEEKLY' | 'DAILY';
  checkCondition: (userId: number, pool: any) => Promise<boolean>;
}

export const BADGES: { [key: string]: Badge } = {
  FIRST_CLIENT: {
    id: 'first_client',
    name: 'Primer Cliente',
    description: 'Convierte tu primer lead en cliente',
    type: 'PERMANENT',
    checkCondition: async (userId: number, pool: any) => {
      const result = await pool.query(
        `SELECT COUNT(*) as conversion_count 
         FROM leads 
         WHERE assigned_to = $1 AND status = 'cliente'`,
        [userId]
      );
      return result.rows[0].conversion_count === 1;
    }
  },

  CLIENT_MASTER: {
    id: 'client_master',
    name: 'Maestro de Clientes',
    description: 'Convierte 50 leads en clientes',
    type: 'PERMANENT',
    checkCondition: async (userId: number, pool: any) => {
      const result = await pool.query(
        `SELECT COUNT(*) as conversion_count 
         FROM leads 
         WHERE assigned_to = $1 AND status = 'cliente'`,
        [userId]
      );
      return parseInt(result.rows[0]?.conversion_count || '0') >= 50;
    }
  },

  FOLLOW_UP_EXPERT: {
    id: 'follow_up_expert',
    name: 'Experto en Seguimiento',
    description: 'Realiza 100 seguimientos exitosos',
    type: 'PERMANENT',
    checkCondition: async (userId: number, pool: any) => {
      const result = await pool.query(
        `SELECT COUNT(*) as followup_count
         FROM lead_interactions
         WHERE user_id = $1 
         AND interaction_type = 'seguimiento'`,
        [userId]
      );
      return parseInt(result.rows[0]?.followup_count || '0') >= 100;
    }
  },

  CHECK_IN_MASTER: {
    id: 'check_in_master',
    name: 'Maestro de Visitas',
    description: 'Realiza 200 check-ins exitosos',
    type: 'PERMANENT',
    checkCondition: async (userId: number, pool: any) => {
      const result = await pool.query(
        `SELECT COUNT(*) as checkin_count
         FROM checkins
         WHERE user_id = $1 
         AND status = 'completed'`,
        [userId]
      );
      return parseInt(result.rows[0]?.checkin_count || '0') >= 200;
    }
  },

  QUICK_CONVERTER: {
    id: 'quick_converter',
    name: 'Conversión Rápida',
    description: 'Convierte un lead en cliente en menos de 15 horas desde su asignación',
    type: 'PERMANENT',
    checkCondition: async (userId: number, pool: any) => {
      const result = await pool.query(
        `SELECT l.id, l.assigned_at, l.updated_at
         FROM leads l
         WHERE l.assigned_to = $1 
         AND l.status = 'cliente'
         AND l.assigned_at IS NOT NULL
         AND EXTRACT(EPOCH FROM (l.updated_at - l.assigned_at))/3600 <= 15`,
        [userId]
      );
      return result.rows.length > 0;
    }
  },

  HIGH_CONVERSION: {
    id: 'high_conversion',
    name: 'Alta Conversión',
    description: 'Mantén una tasa de conversión superior al 30% durante un mes',
    type: 'PERMANENT',
    checkCondition: async (userId: number, pool: any) => {
      const result = await pool.query(
        `WITH monthly_stats AS (
          SELECT 
            COUNT(*) FILTER (WHERE status = 'cliente') as conversions,
            COUNT(*) as total_leads
          FROM leads
          WHERE assigned_to = $1
          AND created_at >= CURRENT_DATE - INTERVAL '30 days'
        )
        SELECT 
          CASE 
            WHEN total_leads > 0 THEN (conversions::float / total_leads) * 100
            ELSE 0
          END as conversion_rate
        FROM monthly_stats`,
        [userId]
      );
      return parseFloat(result.rows[0]?.conversion_rate || '0') >= 30;
    }
  },

  CONSISTENT_PERFORMER: {
    id: 'consistent_performer',
    name: 'Rendimiento Consistente',
    description: 'Mantén 30 días consecutivos de actividad productiva',
    type: 'PERMANENT',
    checkCondition: async (userId: number, pool: any) => {
      const result = await pool.query(
        `WITH daily_points AS (
          SELECT DISTINCT DATE(created_at) as activity_date
          FROM system_logs
          WHERE user_id = $1 
          AND action = 'POINTS_UPDATE'
          AND metadata->>'points'::text != '0'
          ORDER BY activity_date DESC
        )
        SELECT COUNT(*) as consecutive_days
        FROM (
          SELECT activity_date,
                 ROW_NUMBER() OVER (ORDER BY activity_date DESC) as row_num
          FROM daily_points
        ) numbered_dates
        WHERE activity_date = CURRENT_DATE - (row_num - 1)::interval`,
        [userId]
      );
      return parseInt(result.rows[0]?.consecutive_days || '0') >= 30;
    }
  },

  POINTS_MASTER: {
    id: 'points_master',
    name: 'Maestro de Puntos',
    description: 'Alcanza los 5000 puntos totales',
    type: 'PERMANENT',
    checkCondition: async (userId: number, pool: any) => {
      const result = await pool.query(
        'SELECT points_total FROM user_points WHERE user_id = $1',
        [userId]
      );
      return (result.rows[0]?.points_total || 0) >= 5000;
    }
  }
}; 