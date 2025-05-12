import { Pool } from 'pg';
import { messaging } from 'firebase-admin';
import { ReminderLog, LeadWithFollowup, UserWithFCM, FCMNotificationPayload } from '../types/reminder.types';
import pool from '../db';

export class ReminderService {
    private pool: Pool;

    constructor() {
        this.pool = pool;
    }

    async getUpcomingFollowups(): Promise<LeadWithFollowup[]> {
        const query = `
            SELECT l.id, l.name, l.next_followup, l.assigned_to
            FROM leads l
            WHERE l.next_followup IS NOT NULL
            AND l.next_followup BETWEEN NOW() AND NOW() + INTERVAL '15 minutes'
            AND l.assigned_to IN (
                SELECT id FROM users WHERE fcm_token IS NOT NULL
            )
        `;

        const result = await this.pool.query(query);
        return result.rows;
    }

    async getUserFCMToken(userId: string): Promise<string | null> {
        const query = 'SELECT fcm_token FROM users WHERE id = $1';
        const result = await this.pool.query(query, [userId]);
        return result.rows[0]?.fcm_token || null;
    }

    async hasRecentReminder(leadId: string, userId: string): Promise<boolean> {
        const query = `
            SELECT EXISTS (
                SELECT 1 FROM reminder_logs
                WHERE lead_id = $1
                AND user_id = $2
                AND sent_at > NOW() - INTERVAL '24 hours'
            )
        `;
        const result = await this.pool.query(query, [leadId, userId]);
        return result.rows[0].exists;
    }

    async logReminder(leadId: string, userId: string): Promise<ReminderLog> {
        const query = `
            INSERT INTO reminder_logs (lead_id, user_id)
            VALUES ($1, $2)
            RETURNING *
        `;
        const result = await this.pool.query(query, [leadId, userId]);
        return result.rows[0];
    }

    async sendNotification(userId: string, lead: LeadWithFollowup): Promise<void> {
        const fcmToken = await this.getUserFCMToken(userId);
        if (!fcmToken) {
            console.log(`No FCM token found for user ${userId}`);
            return;
        }

        const hasRecentReminder = await this.hasRecentReminder(lead.id, userId);
        if (hasRecentReminder) {
            console.log(`Recent reminder already sent for lead ${lead.id} to user ${userId}`);
            return;
        }

        const notification: FCMNotificationPayload = {
            title: 'Recordatorio de seguimiento',
            body: `Tienes un follow-up programado a las ${lead.next_followup.toLocaleTimeString()} con ${lead.name}`,
            data: {
                leadId: lead.id,
                type: 'followup_reminder'
            }
        };

        try {
            await messaging().send({
                token: fcmToken,
                notification: {
                    title: notification.title,
                    body: notification.body
                },
                data: notification.data
            });

            await this.logReminder(lead.id, userId);
            console.log(`Notification sent successfully to user ${userId} for lead ${lead.id}`);
        } catch (error) {
            console.error(`Error sending notification to user ${userId}:`, error);
            throw error;
        }
    }

    async processUpcomingFollowups(): Promise<void> {
        try {
            const upcomingFollowups = await this.getUpcomingFollowups();
            console.log(`Found ${upcomingFollowups.length} upcoming followups`);

            for (const lead of upcomingFollowups) {
                await this.sendNotification(lead.assigned_to, lead);
            }
        } catch (error) {
            console.error('Error processing upcoming followups:', error);
            throw error;
        }
    }
} 