import cron from 'node-cron';
import db from '../config/db.js';
import notificationService from '../services/NotificationService.js';
import { formatDate, formatTime } from '../utils/dateUtils.js';

class ClassReminderJob {
    constructor() {
        this.scheduleReminders();
    }

    scheduleReminders() {
        // Run every 5 minutes
        cron.schedule('*/5 * * * *', async () => {
            try {
                console.log('Running class reminder job...');
                
                // Get current date and time
                const now = new Date();
                const currentDate = formatDate(now);
                
                // Get all active classes with reminders enabled
                const [classes] = await db.execute(`
                    SELECT c.*, u.first_name, u.last_name, u.email, u.phone
                    FROM classes c
                    JOIN users u ON c.user_id = u.id
                    WHERE c.reminder_enabled = 1
                `);
                
                // Process each class
                for (const classData of classes) {
                    await this.processClassReminders(classData, now, currentDate);
                }
                
                console.log('Class reminder job completed');
            } catch (error) {
                console.error('Error in class reminder job:', error);
            }
        });
    }
    
    /**
     * Process reminders for a single class
     */
    async processClassReminders(classData, now, currentDate) {
        try {
            // If class is not recurring, only process if it's today or in the future
            if (!classData.is_recurring) {
                if (classData.start_date >= currentDate) {
                    await this.checkAndSendReminder(classData, now);
                }
                return;
            }
            
            // For recurring classes, check if there's an instance today
            if (classData.recurrence_type === 'none') return;
            
            // If class has an end date and it's in the past, skip
            if (classData.recurring_end_date && classData.recurring_end_date < currentDate) return;
            
            // Check if today is a valid day for this recurring class
            const isValidToday = this.isValidRecurrenceDay(classData, now);
            if (!isValidToday) return;
            
            // Check for exceptions (cancelled classes)
            const [exceptions] = await db.execute(
                "SELECT * FROM class_exceptions WHERE class_id = ? AND exception_date = ?",
                [classData.id, currentDate]
            );
            
            // If class is cancelled for today, skip
            if (exceptions.length > 0 && exceptions[0].exception_type === 'cancelled') return;
            
            // Get modified time if class is rescheduled
            let startTime = classData.start_time;
            if (exceptions.length > 0 && exceptions[0].exception_type === 'rescheduled') {
                startTime = exceptions[0].new_start_time;
            }
            
            // Create a class instance for today and send reminder
            const todayInstance = {
                ...classData,
                start_time: startTime
            };
            
            await this.checkAndSendReminder(todayInstance, now);
        } catch (error) {
            console.error(`Error processing reminders for class ${classData.id}:`, error);
        }
    }
    
    /**
     * Check if reminder should be sent and send it
     */
    async checkAndSendReminder(classData, now) {
        try {
            // Calculate when the reminder should be sent
            const classTime = new Date(`${classData.start_date}T${classData.start_time}`);
            const reminderTime = new Date(classTime.getTime() - (classData.reminder_minutes_before * 60 * 1000));
            
            // Get time difference in minutes
            const diffMinutes = Math.round((reminderTime - now) / (60 * 1000));
            
            // Send reminder if it's within the next 5 minutes
            if (diffMinutes >= 0 && diffMinutes <= 5) {
                console.log(`Sending reminder for class ${classData.id} - ${classData.title}`);
                
                // Get students registered for this class
                const [registrations] = await db.execute(
                    "SELECT u.* FROM class_registrations cr JOIN users u ON cr.user_id = u.id WHERE cr.class_id = ?",
                    [classData.id]
                );
                
                // Send reminder to each student
                for (const student of registrations) {
                    const user = {
                        id: student.id,
                        email: student.email,
                        phone: student.phone
                    };
                    
                    const classDetails = {
                        id: classData.id,
                        title: classData.title,
                        startDate: classData.start_date,
                        startTime: classData.start_time,
                        duration: classData.duration,
                        instructorName: `${classData.first_name} ${classData.last_name}`,
                        reminderMinutesBefore: classData.reminder_minutes_before
                    };
                    
                    await notificationService.sendClassReminder(user, classDetails);
                }
                
                // Also notify the instructor
                const instructor = {
                    id: classData.user_id,
                    email: classData.email,
                    phone: classData.phone
                };
                
                const instructorClassDetails = {
                    id: classData.id,
                    title: classData.title,
                    startDate: classData.start_date,
                    startTime: classData.start_time,
                    duration: classData.duration,
                    isInstructor: true,
                    reminderMinutesBefore: classData.reminder_minutes_before
                };
                
                await notificationService.sendClassReminder(instructor, instructorClassDetails);
            }
        } catch (error) {
            console.error(`Error checking and sending reminder for class ${classData.id}:`, error);
        }
    }
    
    /**
     * Check if today is a valid day for this recurring class
     */
    isValidRecurrenceDay(classData, now) {
        const dayOfWeek = now.getDay();
        
        switch (classData.recurrence_type) {
            case 'daily':
                return true;
                
            case 'weekly':
                // Check if today is in the recurring days
                if (classData.recurring_days) {
                    let recurringDays;
                    try {
                        // Handle different formats of recurring_days
                        if (typeof classData.recurring_days === 'string') {
                            // If it's already an array, don't try to parse it
                            if (classData.recurring_days.startsWith('[') && classData.recurring_days.endsWith(']')) {
                                recurringDays = JSON.parse(classData.recurring_days);
                            } else {
                                // Handle comma-separated string format
                                recurringDays = classData.recurring_days.split(',').map(day => parseInt(day.trim()));
                            }
                        } else if (Array.isArray(classData.recurring_days)) {
                            // It's already an array
                            recurringDays = classData.recurring_days;
                        } else {
                            // Default to empty array if we can't parse it
                            console.log(`Unable to parse recurring_days for class ${classData.id}: ${classData.recurring_days}`);
                            recurringDays = [];
                        }
                    } catch (error) {
                        console.error(`Error parsing recurring_days for class ${classData.id}:`, error);
                        console.log('recurring_days value:', classData.recurring_days);
                        recurringDays = [];
                    }
                    
                    return recurringDays.includes(dayOfWeek) || recurringDays.includes(dayOfWeek.toString());
                }
                return false;
                
            case 'monthly':
                // Check if today's day of month matches the original start date's day
                const startDate = new Date(classData.start_date);
                return now.getDate() === startDate.getDate();
                
            case 'custom':
                // For custom recurrence, we'd need more complex logic
                // This is a simplified version
                return true;
                
            default:
                return false;
        }
    }
}

export default new ClassReminderJob(); 