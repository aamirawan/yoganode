// routes/adminRoutes.js
import express from 'express';
import {createOrUpdatePage, getAllPages, getPageBySlug} from '../controllers/admin/staticPageController.js';
import {createOrUpdatePost, getAllPosts, deletePost} from '../controllers/admin/blogController.js';
import {createOrUpdatePackage, getAllPackages, deactivatePackage} from '../controllers/admin/packageController.js';
import {getAllTeachers, getTeacherById, updateTeacherProfile, deleteTeacher, approveTeacher, rejectTeacher} from '../controllers/admin/teacherController.js';
import {createStudent, getAllStudents, getStudentById, updateStudent, deleteStudent} from '../controllers/admin/studentController.js';
import { protect } from '../middleware/authMiddleware.js';
import {createClass, getAllClasses, getClassById, updateClass, deleteClass} from '../controllers/admin/classController.js';
import {getAllOrders, getOrderById, cancelOrder, refundOrder} from '../controllers/admin/orderController.js';
import { getAllBookings, cancelBooking } from '../controllers/admin/bookingController.js';

const router = express.Router();

// Middleware for admin auth (add accordingly)

// Static Pages
router.post('/page', protect, createOrUpdatePage);
router.get('/pages', protect, getAllPages);
router.get('/page/:slug', protect, getPageBySlug);

// Blog / Video
router.post('/post', protect, createOrUpdatePost);
router.get('/posts', protect, getAllPosts);
router.delete('/post/:id', protect, deletePost);

// Subscription Packages
router.post('/package', protect, createOrUpdatePackage);
router.get('/packages', protect, getAllPackages);
router.put('/package/deactivate/:id', protect, deactivatePackage);

//Admin Teacher Management
router.get('/teachers', protect, getAllTeachers);
router.get('/teacher/:id', protect, getTeacherById);
router.put('/teacher/:id', protect, updateTeacherProfile);
router.delete('/teacher/:id', protect, deleteTeacher);
router.put('/teacher/approve/:userId', protect, approveTeacher);
router.put('/teacher/reject/:userId', protect, rejectTeacher);

// Student Management (Admin)
router.post('/students', protect, createStudent);
router.get('/students', protect, getAllStudents);
router.get('/students/:id', protect, getStudentById);
router.put('/students/:id', protect, updateStudent);
router.delete('/students/:id', protect, deleteStudent);

// Class CRUD
router.post('/classes', protect, createClass);
router.get('/classes', protect, getAllClasses);
router.get('/classes/:id', protect, getClassById);
router.put('/classes/:id', protect, updateClass);
router.delete('/classes/:id', protect, deleteClass);

// Order Management
router.get('/orders', protect, getAllOrders);
router.get('/order/:id', protect, getOrderById);
router.put('/order/cancel/:id', protect, cancelOrder);
router.put('/order/refund/:id', protect, refundOrder);

// Bookings
router.get('/bookings', protect, getAllBookings);
router.put('/:bookingId/cancel', protect, cancelBooking);

export default router;
