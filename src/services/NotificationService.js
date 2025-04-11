import nodemailer from 'nodemailer';
import axios from 'axios';
import Notification from '../models/Notification.js';
import { getEmailTemplate } from '../utils/emailTemplates.js';

class NotificationService {
    constructor() {
        this.emailTransporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        this.watiApiKey = process.env.WATI_API_KEY;
        this.watiApiUrl = process.env.WATI_API_URL;
    }

    async sendEmailNotification(user, notification) {
        try {
            const template = getEmailTemplate(notification.type, notification.data);
            
            await this.emailTransporter.sendMail({
                from: process.env.EMAIL_FROM,
                to: user.email,
                subject: notification.title,
                html: template
            });

            await Notification.create({
                userId: user.id,
                type: notification.type,
                title: notification.title,
                message: notification.message,
                status: 'sent',
                channel: 'email'
            });

            return true;
        } catch (error) {
            console.error('Email notification error:', error);
            await Notification.create({
                userId: user.id,
                type: notification.type,
                title: notification.title,
                message: notification.message,
                status: 'failed',
                channel: 'email'
            });
            return false;
        }
    }

    async sendSMSNotification(user, notification) {
        try {
            // Format phone number for WATI (remove any non-numeric characters)
            const formattedPhone = user.phone.replace(/\D/g, '');
            
            await axios.post(
                `${this.watiApiUrl}/api/v1/sendTemplateMessage`,
                {
                    template_name: notification.type === 'class_reminder' ? 'class_reminder' : 'default',
                    broadcast_name: notification.title,
                    parameters: [
                        {
                            name: "message",
                            value: notification.message
                        }
                    ],
                    phone_numbers: [formattedPhone]
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.watiApiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            await Notification.create({
                userId: user.id,
                type: notification.type,
                title: notification.title,
                message: notification.message,
                status: 'sent',
                channel: 'sms'
            });

            return true;
        } catch (error) {
            console.error('SMS notification error:', error);
            await Notification.create({
                userId: user.id,
                type: notification.type,
                title: notification.title,
                message: notification.message,
                status: 'failed',
                channel: 'sms'
            });
            return false;
        }
    }

    async sendWhatsAppNotification(user, notification) {
        try {
            // Format phone number for WATI (remove any non-numeric characters)
            const formattedPhone = user.phone.replace(/\D/g, '');
            
            await axios.post(
                `${this.watiApiUrl}/api/v1/sendTemplateMessage`,
                {
                    template_name: notification.type === 'class_reminder' ? 'class_reminder_whatsapp' : 'default_whatsapp',
                    broadcast_name: notification.title,
                    parameters: [
                        {
                            name: "message",
                            value: notification.message
                        }
                    ],
                    phone_numbers: [formattedPhone]
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.watiApiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            await Notification.create({
                userId: user.id,
                type: notification.type,
                title: notification.title,
                message: notification.message,
                status: 'sent',
                channel: 'whatsapp'
            });

            return true;
        } catch (error) {
            console.error('WhatsApp notification error:', error);
            await Notification.create({
                userId: user.id,
                type: notification.type,
                title: notification.title,
                message: notification.message,
                status: 'failed',
                channel: 'whatsapp'
            });
            return false;
        }
    }

    async sendClassBookingConfirmation(user, classDetails) {
        const notification = {
            type: 'class_booking',
            title: 'Class Booking Confirmation',
            message: `Your booking for class "${classDetails.title}" has been confirmed. Class starts at ${classDetails.startTime}`,
            data: classDetails
        };

        // Send through all channels
        await this.sendEmailNotification(user, notification);
        await this.sendWhatsAppNotification(user, notification);
        await this.sendSMSNotification(user, notification);
    }

    async sendClassCancellationNotification(user, classDetails) {
        const notification = {
            type: 'class_cancellation',
            title: 'Class Booking Cancelled',
            message: `Your booking for class "${classDetails.title}" has been cancelled.`,
            data: classDetails
        };

        // Send through all channels
        await this.sendEmailNotification(user, notification);
        await this.sendWhatsAppNotification(user, notification);
        await this.sendSMSNotification(user, notification);
    }

    async sendClassReminder(user, classDetails) {
        const notification = {
            type: 'class_reminder',
            title: 'Upcoming Class Reminder',
            message: `Reminder: Your class "${classDetails.title}" is scheduled for ${classDetails.startTime}`,
            data: classDetails
        };

        // Send through all channels
        await this.sendEmailNotification(user, notification);
        await this.sendWhatsAppNotification(user, notification);
        await this.sendSMSNotification(user, notification);
    }

    async sendOrderConfirmation(user, orderDetails) {
        const notification = {
            type: 'order_confirmation',
            title: 'Order Confirmation',
            message: `Your order #${orderDetails.orderId} has been confirmed.`,
            data: orderDetails
        };

        // Send through all channels
        await this.sendEmailNotification(user, notification);
        await this.sendWhatsAppNotification(user, notification);
        await this.sendSMSNotification(user, notification);
    }

    async sendAbandonedCartNotification(user, cartDetails) {
        const notification = {
            type: 'abandoned_cart',
            title: 'Complete Your Purchase',
            message: 'You have items in your cart waiting to be purchased.',
            data: cartDetails
        };

        // Send through all channels
        await this.sendEmailNotification(user, notification);
        await this.sendWhatsAppNotification(user, notification);
        await this.sendSMSNotification(user, notification);
    }

    async sendIssueConfirmation(user, issueDetails) {
        const notification = {
            type: 'issue_confirmation',
            title: 'Issue Report Confirmation',
            message: `Your issue "${issueDetails.title}" has been received and assigned ID #${issueDetails.issueId}. We will get back to you soon.`,
            data: issueDetails
        };

        // Send through all channels
        await this.sendEmailNotification(user, notification);
        await this.sendWhatsAppNotification(user, notification);
        await this.sendSMSNotification(user, notification);
    }
}

export default new NotificationService(); 