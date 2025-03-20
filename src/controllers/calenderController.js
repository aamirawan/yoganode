import db from "../config/db.js";

export const setAvailability = async (req, res) => {
    const { user_id, day_of_week, start_time, end_time, is_recurring, session_duration } = req.body;

    // Validate input
    if (user_id == null || day_of_week == null || start_time == null || end_time == null) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        // Insert the availability record for the teacher
        const [result] = await db.execute(
            "INSERT INTO teacher_availability (user_id, day_of_week, start_time, end_time, is_recurring, session_duration) VALUES (?, ?, ?, ?, ?, ?)",
            [user_id, day_of_week, start_time, end_time, is_recurring ?? true, session_duration ?? 60]
        );

        // Fetch the newly inserted row by its auto-incremented ID
        const [newAvailability] = await db.execute(
            "SELECT * FROM teacher_availability WHERE id = ?",
            [result.insertId]
        );

        // Respond with a success message and the newly inserted row
        res.status(201).json({
            message: "Availability set successfully",
            availability: newAvailability[0] // Returning the newly inserted row
        });
    } catch (error) {
        res.status(500).json({ error: "Database error", details: error.message });
    }
};

export const getAvailability = async (req, res) => {
    const { teacher_id } = req.params;

    try {
        const [rows] = await db.execute("SELECT * FROM teacher_availability WHERE user_id = ?", [teacher_id]);
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ error: "Database error", details: error.message });
    }
};

// removeAvailabilitySlot function to remove an availability slot based on the ID
export const removeAvailabilitySlot = async (req, res) => {
    const { id } = req.params;  // Get the ID from the URL parameter

    try {
        // First, check if the availability slot exists
        const [existingSlot] = await db.execute(
            "SELECT * FROM teacher_availability WHERE id = ?",
            [id]
        );

        // If the slot doesn't exist, return a 404 error
        if (existingSlot.length === 0) {
            return res.status(404).json({ error: "Availability slot not found" });
        }

        // Delete the availability slot
        const [result] = await db.execute(
            "DELETE FROM teacher_availability WHERE id = ?",
            [id]
        );

        // If no rows were affected, something went wrong
        if (result.affectedRows === 0) {
            return res.status(500).json({ error: "Failed to delete the availability slot" });
        }

        // Return success message if deletion is successful
        res.status(200).json({ message: "Availability slot removed successfully" });
    } catch (error) {
        res.status(500).json({ error: "Database error", details: error.message });
    }
};
