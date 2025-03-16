import db from "../config/db.js";

export const reportIssue = async (req, res) => {
    const { teacher_id, issue } = req.body;

    try {
        await db.execute("INSERT INTO issue_reports (teacher_id, issue) VALUES (?, ?)", [teacher_id, issue]);
        res.status(201).json({ message: "Issue reported successfully" });
    } catch (error) {
        res.status(500).json({ error: "Database error", details: error.message });
    }
};