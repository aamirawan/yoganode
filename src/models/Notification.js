import db from '../config/db.js';

class Notification {
    static async create(notification) {
        const { userId, type, title, message, status, channel } = notification;
        const [result] = await db.execute(
            `INSERT INTO notifications (user_id, type, title, message, status, channel, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [userId, type, title, message, status, channel]
        );
        return result.insertId;
    }

    static async getByUserId(userId) {
        const [rows] = await db.execute(
            `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC`,
            [userId]
        );
        return rows;
    }

    static async updateStatus(notificationId, status) {
        await db.execute(
            `UPDATE notifications SET status = ? WHERE id = ?`,
            [status, notificationId]
        );
    }
}

export default Notification; 