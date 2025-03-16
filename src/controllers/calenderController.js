import db from "../config/db.js";

export const setAvailability = async (req, res) => {
    const { teacher_id, available_days, time_slots } = req.body;

    try {
        await db.execute(
            "INSERT INTO teacher_availability (teacher_id, available_days, time_slots) VALUES (?, ?, ?)",
            [teacher_id, available_days, JSON.stringify(time_slots)]
        );
        res.status(201).json({ message: "Availability set successfully" });
    } catch (error) {
        res.status(500).json({ error: "Database error", details: error.message });
    }
};

export const getAvailability = async (req, res) => {
    const { teacher_id } = req.params;

    try {
        const [rows] = await db.execute("SELECT * FROM teacher_availability WHERE teacher_id = ?", [teacher_id]);
        res.status(200).json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: "Database error", details: error.message });
    }
};
