import razorpay from '../config/razorpay.js';
import db from '../config/db.js';
import crypto from 'crypto';

export const createOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        console.log("userId", userId);
        const { packageId, couponCode } = req.body;

        // 1. Get package
        const [packageRows] = await db.query('SELECT * FROM SubscriptionPackages WHERE id = ?', [packageId]);
        if (packageRows.length === 0) return res.status(400).json({ message: 'Invalid subscription package.' });

        let selectedPackage = packageRows[0];
        let amount = parseFloat(selectedPackage.price);

        // 2. Apply coupon if provided
        if (couponCode) {
            const [couponRows] = await db.query('SELECT * FROM Coupons WHERE code = ?', [couponCode]);
            if (couponRows.length === 0) return res.status(400).json({ message: 'Invalid coupon code.' });

            const discount = parseFloat(couponRows[0].discount); // e.g., 0.2 for 20%
            amount = amount * (1 - discount);
        }

        const finalAmount = Math.round(amount * 100); // Razorpay needs amount in paisa

        // 3. Create Razorpay order
        const razorpayOrder = await razorpay.orders.create({
            amount: finalAmount,
            currency: 'INR',
            receipt: `receipt_${Date.now()}`,
            notes: {
                userId,
                packageId,
            },
        });

        // 4. Save a pending order to DB
        await db.query(`
        INSERT INTO Orders (userId, subscriptionPackageId, amount, transactionId, paymentStatus)
        VALUES (?, ?, ?, ?, ?)
      `, [userId, packageId, amount, razorpayOrder.id, 'pending']);

        // 5. Return payment URL (or details for frontend to use with Razorpay modal)
        return res.status(200).json({
            orderId: razorpayOrder.id,
            amount: finalAmount,
            currency: 'INR',
            key: process.env.RAZORPAY_KEY_ID,
        });
    } catch (err) {
        console.error('Create Order Error:', err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const verifyPayment = async (req, res) => {
    try {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      } = req.body;
  
      const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
      hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
      const digest = hmac.digest('hex');
  
      if (digest !== razorpay_signature) {
        return res.status(400).json({ message: 'Invalid payment signature' });
      }
  
      // Mark order as paid
      await db.query(`
        UPDATE Orders
        SET paymentStatus = 'paid'
        WHERE transactionId = ?
      `, [razorpay_order_id]);
  
      // Optionally: Add credits to user, send email, etc.
  
      return res.status(200).json({ message: 'Payment verified successfully' });
    } catch (err) {
      console.error('Verify Payment Error:', err);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
};