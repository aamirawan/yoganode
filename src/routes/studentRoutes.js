import express from 'express';
import { getAvailableClasses, getOneOnOneSessionClasses } from '../controllers/classController.js';
import { protect } from '../middleware/authMiddleware.js';
import {getActivePackages, getPackageById, createSubscriptionOrder, getUserSubscriptions} from '../controllers/subscriptionController.js';
import {createOrder, verifyPayment} from '../controllers/paymentController.js';
import { bookGroupClass, getUserBookings, cancelUserBooking, bookOneOnOneSession } from '../controllers/bookingController.js';

const router = express.Router();

// Route: /api/classes (with optional filters)
router.post('/get/classes', getAvailableClasses);
router.get('/get/one/on/one/sessions', getOneOnOneSessionClasses)

// Subscriptions
router.get('/packages', protect, getActivePackages);
router.get('/packages/:id', protect, getPackageById);
router.post('/order', protect, createSubscriptionOrder);
router.get('/my-orders', protect, getUserSubscriptions);

// Payments
router.post('/create/order', protect, createOrder);
router.post('/payment/verify', protect, verifyPayment);

// Bookings
router.post('/bookings/group', protect, bookGroupClass);
router.post('/bookings/one-on-one', protect, bookOneOnOneSession);
router.get('/bookings', protect, getUserBookings);
router.delete('/bookings/:bookingId', protect, cancelUserBooking);

export default router;
