import express from "express";
import { createTeacherProfile, getTeacherProfile } from "../controllers/teacherController.js";
import { protect } from "../middleware/authMiddleware.js";
import { createClass, getAllClasses } from "../controllers/classController.js";
import { setAvailability, getAvailability } from "../controllers/calenderController.js";
import { getUpcomingClasses } from "../controllers/classManagementController.js";
import { reportIssue } from "../controllers/issueController.js";
import { cancelClass } from "../controllers/classCancellationController.js";

const router = express.Router();

router.post("/profile", protect, createTeacherProfile);
router.get("/profile/:id", protect, getTeacherProfile);

router.post("/classes", protect, createClass);
router.get("/classes", protect, getAllClasses);

router.post("/availability", protect, setAvailability);
router.get("/availability/:teacher_id", protect, getAvailability);

router.get("/upcoming-classes/:teacher_id", protect, getUpcomingClasses);

router.post("/report-issue", protect, reportIssue);

router.delete("/cancel-class/:class_id", protect, cancelClass);

export default router;
