import db from '../../config/db.js';

// Get All Orders
export const getAllOrders = async (req, res) => {
  try {
    const [orders] = await db.query(`
      SELECT Orders.*, users.first_name, users.email, sp.name AS package_name 
      FROM Orders
      JOIN users ON users.id = Orders.userId
      JOIN SubscriptionPackages sp ON sp.id = Orders.subscriptionPackageId
    `);
    return res.json(orders);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Get Single Order
export const getOrderById = async (req, res) => {
  try {
    const [order] = await db.query(`SELECT * FROM Orders WHERE id = ?`, [req.params.id]);
    return res.json(order[0]);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Cancel Order
export const cancelOrder = async (req, res) => {
  try {
    await db.query(
      `UPDATE Orders SET paymentStatus = 'failed', refundStatus = 'requested' WHERE id = ?`,
      [req.params.id]
    );
    return res.json({ message: 'Order cancelled and refund requested' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Refund Order
export const refundOrder = async (req, res) => {
  try {
    await db.query(
      `UPDATE Orders SET refundStatus = 'refunded' WHERE id = ?`,
      [req.params.id]
    );
    return res.json({ message: 'Order refunded successfully' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
