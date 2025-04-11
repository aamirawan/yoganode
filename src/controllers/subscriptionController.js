import db from '../config/db.js';
import notificationService from '../services/NotificationService.js';

// Get all active packages
export const getActivePackages = async (req, res) => {
  try {
    const [packages] = await db.execute(`
      SELECT id, name, description, durationDays, price, freeTrialClasses, groupClasses, oneOnOneSessions, features
      FROM SubscriptionPackages
      WHERE isActive = 1
    `);

    return res.status(200).json({ success: true, data: packages });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch packages', error: err });
  }
};

// Get a package by ID
export const getPackageById = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.execute(`
      SELECT * FROM SubscriptionPackages WHERE id = ? AND isActive = 1
    `, [id]);

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }

    return res.status(200).json({ success: true, data: rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch package', error: err });
  }
};

// Purchase a package
export const createSubscriptionOrder = async (req, res) => {
  const { subscriptionPackageId, amount, transactionId } = req.body;
  const userId = req.user.id;

  try {
    // Optional: check if user already has an active subscription
    const [existing] = await db.execute(`
      SELECT * FROM Orders
      WHERE userId = ? AND paymentStatus = 'paid'
      ORDER BY createdAt DESC LIMIT 1
    `, [userId]);

    // Get user details and package details
    const [userDetails] = await db.execute('SELECT * FROM users WHERE id = ?', [userId]);
    const [packageDetails] = await db.execute('SELECT * FROM SubscriptionPackages WHERE id = ?', [subscriptionPackageId]);

    // Insert order
    const [result] = await db.execute(`
      INSERT INTO Orders (userId, subscriptionPackageId, amount, transactionId, paymentStatus)
      VALUES (?, ?, ?, ?, 'paid')
    `, [userId, subscriptionPackageId, amount, transactionId]);

    // Send order confirmation notification
    const user = {
      id: userId,
      email: userDetails[0].email,
      phone: userDetails[0].phone
    };

    const orderDetails = {
      userName: `${userDetails[0].first_name} ${userDetails[0].last_name}`,
      orderId: result.insertId,
      packageName: packageDetails[0].name,
      amount: amount
    };

    await notificationService.sendOrderConfirmation(user, orderDetails);

    return res.status(201).json({ success: true, message: 'Subscription purchased', orderId: result.insertId });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to purchase subscription', error: err });
  }
};

// Get user's subscription history
export const getUserSubscriptions = async (req, res) => {
  const userId = req.user.id;

  try {
    const [orders] = await db.execute(`
      SELECT o.*, p.name, p.durationDays, p.freeTrialClasses, p.groupClasses, p.oneOnOneSessions
      FROM Orders o
      JOIN SubscriptionPackages p ON o.subscriptionPackageId = p.id
      WHERE o.userId = ?
      ORDER BY o.createdAt DESC
    `, [userId]);

    return res.status(200).json({ success: true, data: orders });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to get subscriptions', error: err });
  }
};
