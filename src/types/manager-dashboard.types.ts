export interface TeamOverview {
  team_id: number;
  team_name: string;
  total_users: number;
  total_checkins: number;
  total_leads: number;
  won_leads: number;
  total_sales: number;
  avg_visit_duration: number;
  conversion_rate: number;
}

export interface TeamRanking {
  user_id: number;
  user_name: string;
  total_checkins: number;
  total_leads: number;
  won_leads: number;
  total_sales: number;
  avg_visit_duration: number;
  conversion_rate: number;
  sales_rank: number;
  conversion_rank: number;
}

export interface LeadStatus {
  id: number;
  lead_name: string;
  status: string;
  priority: string;
  type: string;
  next_followup: Date;
  estimated_value: number;
  assigned_to: string;
  is_overdue: boolean;
}

export interface DelayedCheckin {
  id: number;
  checkin_time: Date;
  checkout_time: Date;
  location: string;
  status: string;
  user_name: string;
  lead_name: string;
  delay_type: 'Retraso' | 'Fuera de zona' | 'Otro';
}

export interface ExportFilters {
  campaign?: string;
  status?: string;
}

export interface DateRange {
  startDate: string;
  endDate: string;
} 