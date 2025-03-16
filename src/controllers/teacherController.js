import db from "../config/db.js";

export const createTeacherProfile = async (req, res) => {
    const { name, email, phone, profile_photo, certifications } = req.body;

    try {
        const [result] = await db.execute(
            "INSERT INTO teachers (name, email, phone, profile_photo, certifications) VALUES (?, ?, ?, ?, ?)",
            [name, email, phone, profile_photo, certifications]
        );
        res.status(201).json({ message: "Profile created successfully", teacherId: result.insertId });
    } catch (error) {
        res.status(500).json({ error: "Database error", details: error.message });
    }
};

export const getTeacherProfile = async (req, res) => {
    const { id } = req.params;

    try {
        const [rows] = await db.execute("SELECT * FROM teachers WHERE id = ?", [id]);
        if (rows.length === 0) return res.status(404).json({ error: "Teacher not found" });
        res.status(200).json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: "Database error", details: error.message });
    }
};
