import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createClass,
  getTeacherClasses,
  getClassById,
  updateClass,
  deleteClass,
  getClassInstances
} from "../controllers/enhancedClassController.js";

const router = express.Router();

// Protected routes (require authentication)
router.use(protect);

// Class management routes
router.post("/", createClass);
router.get("/teacher/:teacher_id", getTeacherClasses);
router.get("/instances", getClassInstances);
router.get("/:class_id", getClassById);
router.put("/:class_id", updateClass);
router.delete("/:class_id", deleteClass);

export default router;
