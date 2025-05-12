export interface ReminderLog {
    id: string;
    lead_id: string;
    user_id: string;
    sent_at: Date;
    created_at: Date;
}

export interface LeadWithFollowup {
    id: string;
    name: string;
    next_followup: Date;
    assigned_to: string;
}

export interface UserWithFCM {
    id: string;
    fcm_token: string;
}

export interface FCMNotificationPayload {
    title: string;
    body: string;
    data?: Record<string, string>;
} 