import db from "../config/db.js";

export const cancelClass = async (req, res) => {
    const { class_id } = req.params;

    try {
        await db.execute("DELETE FROM classes WHERE id = ?", [class_id]);
        res.status(200).json({ message: "Class cancelled successfully" });
    } catch (error) {
        res.status(500).json({ error: "Database error", details: error.message });
    }
};
