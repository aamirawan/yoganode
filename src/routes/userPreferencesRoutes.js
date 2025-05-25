import express from 'express';
import { saveQuestionnaireResponses, checkQuestionnaireStatus } from '../controllers/userPreferencesController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Routes require authentication
router.post('/questionnaire', protect, saveQuestionnaireResponses);
router.get('/questionnaire/status', protect, checkQuestionnaireStatus);

export default router;
