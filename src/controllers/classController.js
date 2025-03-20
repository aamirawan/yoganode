import db from "../config/db.js";

export const createClass = async (req, res) => {
    const { user_id, title, subtitle, description, maxParticipants, duration, level, recurringDays } = req.body;

    // Set default values for optional fields
    const participants = maxParticipants || 20;  // Default to 20 if not provided
    const classDuration = duration || 60;         // Default to 60 if not provided
    const classLevel = level || 'Beginner';       // Default to 'Beginner' if not provided

    try {
        // Insert data into the group_classes table
        await db.execute(
            "INSERT INTO classes (user_id, title, subtitle, description, max_participants, duration, level, recurring_days) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [
                user_id, 
                title, 
                subtitle, 
                description || '', // If description is not provided, use an empty string
                participants, 
                classDuration, 
                classLevel, 
                JSON.stringify(recurringDays) // Ensure recurring_days is stored as a JSON string
            ]
        );
        res.status(201).json({ message: "Class created successfully" });
    } catch (error) {
        res.status(500).json({ error: "Database error", details: error.message });
    }
};

export const getAllClasses = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.execute(`SELECT * FROM classes WHERE user_id = ?`, [id]);
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ error: "Database error", details: error.message });
    }
};
