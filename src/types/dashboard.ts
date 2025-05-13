export interface DashboardOverview {
  leads_summary: {
    total: number;
    by_status: Array<{
      status: string;
      count: number;
    }>;
    won: number;
    lost: number;
    conversion_rate: number;
    pending_followups: number;
    inactive: number;
  };
  checkins_summary: {
    total: number;
    by_day: Array<{
      date: Date;
      count: number;
    }>;
    by_city: Array<{
      city: string;
      count: number;
    }>;
    total_distance: number;
    estimated_cost: number;
  };
  users_summary: {
    by_role: Array<{
      role: string;
      count: number;
    }>;
  };
  activity_summary: {
    last_30_days: {
      checkins: number;
      new_leads: number;
    };
  };
} 