import express from 'express';
import { getActivePackages, getPackageById } from '../controllers/subscriptionController.js';

const router = express.Router();

// Public routes for subscription packages
router.get('/packages', getActivePackages);
router.get('/packages/:id', getPackageById);

export default router;
