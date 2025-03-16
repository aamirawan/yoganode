import db from "../config/db.js";

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
