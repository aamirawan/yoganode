import express from 'express';
import { createClassException, getClassExceptions, deleteClassException } from '../controllers/classExceptionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Create a class exception
router.post('/classes/:class_id/exceptions', createClassException);

// Get all exceptions for a class
router.get('/classes/:class_id/exceptions', getClassExceptions);

// Delete a class exception
router.delete('/classes/:class_id/exceptions/:exception_id', deleteClassException);

export default router;
