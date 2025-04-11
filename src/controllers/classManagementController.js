import db from "../config/db.js";
import notificationService from "../services/NotificationService.js";

export const getUpcomingClasses = async (req, res) => {
    const { teacher_id } = req.params;

    try {
        const [rows] = await db.execute(
            "SELECT * FROM classes WHERE teacher_id = ? AND created_at > NOW()",
            [teacher_id]
        );
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ error: "Database error", details: error.message });
    }
};

export const bookClass = async (req, res) => {
    const { class_id, user_id } = req.body;

    try {
        // Check if class exists and has available spots
        const [classData] = await db.execute(
            "SELECT c.*, u.first_name, u.last_name FROM classes c JOIN users u ON c.user_id = u.id WHERE c.id = ?",
            [class_id]
        );

        if (classData.length === 0) {
            return res.status(404).json({ error: "Class not found" });
        }

        const classInfo = classData[0];

        // Check if user is already booked
        const [existingBooking] = await db.execute(
            "SELECT * FROM class_bookings WHERE class_id = ? AND user_id = ?",
            [class_id, user_id]
        );

        if (existingBooking.length > 0) {
            return res.status(400).json({ error: "Already booked for this class" });
        }

        // Insert booking
        await db.execute(
            "INSERT INTO class_bookings (class_id, user_id, status) VALUES (?, ?, 'confirmed')",
            [class_id, user_id]
        );

        // Get user details for notification
        const [userDetails] = await db.execute(
            "SELECT * FROM users WHERE id = ?",
            [user_id]
        );

        // Send booking confirmation notification
        const user = {
            id: user_id,
            email: userDetails[0].email,
            phone: userDetails[0].phone
        };

        const classDetails = {
            title: classInfo.title,
            startTime: classInfo.start_time,
            duration: classInfo.duration,
            instructorName: `${classInfo.first_name} ${classInfo.last_name}`
        };

        await notificationService.sendClassBookingConfirmation(user, classDetails);

        res.status(201).json({ message: "Class booked successfully" });
    } catch (error) {
        res.status(500).json({ error: "Database error", details: error.message });
    }
};

export const cancelBooking = async (req, res) => {
    const { booking_id } = req.params;
    const user_id = req.user.id;

    try {
        // Get booking details
        const [booking] = await db.execute(
            `SELECT cb.*, c.title, c.start_time, c.duration, u.first_name, u.last_name 
             FROM class_bookings cb 
             JOIN classes c ON cb.class_id = c.id 
             JOIN users u ON c.user_id = u.id 
             WHERE cb.id = ? AND cb.user_id = ?`,
            [booking_id, user_id]
        );

        if (booking.length === 0) {
            return res.status(404).json({ error: "Booking not found" });
        }

        // Update booking status
        await db.execute(
            "UPDATE class_bookings SET status = 'cancelled' WHERE id = ?",
            [booking_id]
        );

        // Get user details for notification
        const [userDetails] = await db.execute(
            "SELECT * FROM users WHERE id = ?",
            [user_id]
        );

        // Send cancellation notification
        const user = {
            id: user_id,
            email: userDetails[0].email,
            phone: userDetails[0].phone
        };

        const classDetails = {
            title: booking[0].title,
            startTime: booking[0].start_time,
            duration: booking[0].duration,
            instructorName: `${booking[0].first_name} ${booking[0].last_name}`
        };

        await notificationService.sendClassCancellationNotification(user, classDetails);

        res.status(200).json({ message: "Booking cancelled successfully" });
    } catch (error) {
        res.status(500).json({ error: "Database error", details: error.message });
    }
};
