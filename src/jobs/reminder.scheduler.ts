import cron from 'node-cron';
import { ReminderService } from '../services/reminder.service';

export class ReminderScheduler {
    private reminderService: ReminderService;
    private cronJob: cron.ScheduledTask;

    constructor() {
        this.reminderService = new ReminderService();
        // Ejecutar cada 5 minutos
        this.cronJob = cron.schedule('*/5 * * * *', this.executeReminders.bind(this));
    }

    private async executeReminders(): Promise<void> {
        console.log('Executing reminder check at:', new Date().toISOString());
        try {
            await this.reminderService.processUpcomingFollowups();
        } catch (error) {
            console.error('Error in reminder scheduler:', error);
        }
    }

    public start(): void {
        this.cronJob.start();
        console.log('Reminder scheduler started');
    }

    public stop(): void {
        this.cronJob.stop();
        console.log('Reminder scheduler stopped');
    }
} 