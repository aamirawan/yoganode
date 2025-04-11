import cron from 'node-cron';
import db from '../config/db.js';
import notificationService from '../services/NotificationService.js';

class AbandonedCartJob {
    constructor() {
        this.scheduleAbandonedCartCheck();
    }

    scheduleAbandonedCartCheck() {
        // Run every 6 hours
        cron.schedule('0 */6 * * *', async () => {
            try {
                // Get carts that were last updated more than 1 hour ago but less than 24 hours ago
                const [carts] = await db.execute(`
                    SELECT c.*, u.first_name, u.last_name, u.email, u.phone
                    FROM carts c
                    JOIN users u ON c.user_id = u.id
                    WHERE c.updated_at BETWEEN DATE_SUB(NOW(), INTERVAL 24 HOUR) 
                    AND DATE_SUB(NOW(), INTERVAL 1 HOUR)
                    AND c.status = 'active'
                `);

                for (const cart of carts) {
                    const user = {
                        id: cart.user_id,
                        email: cart.email,
                        phone: cart.phone
                    };

                    const cartDetails = {
                        userName: `${cart.first_name} ${cart.last_name}`,
                        items: JSON.parse(cart.items),
                        total: cart.total,
                        cartUrl: `${process.env.FRONTEND_URL}/cart/${cart.id}`
                    };

                    await notificationService.sendAbandonedCartNotification(user, cartDetails);
                }
            } catch (error) {
                console.error('Error in abandoned cart job:', error);
            }
        });
    }
}

export default new AbandonedCartJob(); 