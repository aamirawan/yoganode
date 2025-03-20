import express from "express";
import { createTeacherProfile, getTeacherProfile } from "../controllers/teacherController.js";
import { protect } from "../middleware/authMiddleware.js";
import { createClass, getAllClasses } from "../controllers/classController.js";
import { setAvailability, getAvailability, removeAvailabilitySlot } from "../controllers/calenderController.js";
import { getUpcomingClasses } from "../controllers/classManagementController.js";
import { reportIssue, getIssues } from "../controllers/issueController.js";
import { cancelClass } from "../controllers/classCancellationController.js";

const router = express.Router();

router.post("/profile", protect, createTeacherProfile);
router.get("/profile/:id", protect, getTeacherProfile);

router.post("/classes", protect, createClass);
router.get("/classes/:id", protect, getAllClasses);

router.post("/availability", protect, setAvailability);
router.get("/availability/:teacher_id", protect, getAvailability);
router.delete("/availability/:id", protect, removeAvailabilitySlot);

router.get("/upcoming-classes/:teacher_id", protect, getUpcomingClasses);

router.post("/report-issue", protect, reportIssue);
router.get("/report-issue/:id", protect, getIssues);

router.delete("/cancel-class/:class_id", protect, cancelClass);

export default router;
