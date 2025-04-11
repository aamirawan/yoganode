import cron from 'node-cron';
import db from '../config/db.js';
import notificationService from '../services/NotificationService.js';

class ClassReminderJob {
    constructor() {
        this.scheduleReminders();
    }

    scheduleReminders() {
        // Run every hour
        cron.schedule('0 * * * *', async () => {
            try {
                // Get classes starting in the next 24 hours
                const [classes] = await db.execute(`
                    SELECT c.*, u.first_name, u.last_name, u.email, u.phone
                    FROM classes c
                    JOIN users u ON c.user_id = u.id
                    WHERE c.start_time BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 24 HOUR)
                    AND c.status = 'scheduled'
                `);

                for (const classData of classes) {
                    const user = {
                        id: classData.user_id,
                        email: classData.email,
                        phone: classData.phone
                    };

                    const classDetails = {
                        title: classData.title,
                        startTime: classData.start_time,
                        duration: classData.duration,
                        instructorName: `${classData.first_name} ${classData.last_name}`
                    };

                    await notificationService.sendClassReminder(user, classDetails);
                }
            } catch (error) {
                console.error('Error in class reminder job:', error);
            }
        });
    }
}

export default new ClassReminderJob(); 