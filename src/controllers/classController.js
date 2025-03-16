import db from "../config/db.js";

export const createClass = async (req, res) => {
    const { teacher_id, title, subtitle, recurring_days } = req.body;

    try {
        await db.execute(
            "INSERT INTO classes (teacher_id, title, subtitle, recurring_days) VALUES (?, ?, ?, ?)",
            [teacher_id, title, subtitle, recurring_days]
        );
        res.status(201).json({ message: "Class created successfully" });
    } catch (error) {
        res.status(500).json({ error: "Database error", details: error.message });
    }
};

export const getAllClasses = async (req, res) => {
    try {
        const [rows] = await db.execute("SELECT * FROM classes");
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ error: "Database error", details: error.message });
    }
};
