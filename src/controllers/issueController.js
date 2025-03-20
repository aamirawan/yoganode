import db from "../config/db.js";

export const reportIssue = async (req, res) => {
    const { user_id, title, description, priority } = req.body;

    try {
        // Assuming you're using mysql2 or a similar package
        const [result] = await db.execute(
            "INSERT INTO issue_reports (user_id, title, description, priority) VALUES (?, ?, ?, ?)",
            [user_id, title, description, priority]
        );

        // Retrieve the inserted row by its ID
        const [newIssue] = await db.execute(
            "SELECT * FROM issue_reports WHERE id = ?",
            [result.insertId]
        );

        res.status(201).json({ message: "Issue reported successfully", issue: newIssue[0] });
    } catch (error) {
        res.status(500).json({ error: "Database error", details: error.message });
    }
};

export const getIssues = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.execute(`SELECT * FROM issue_reports WHERE user_id = ?`, [id]);
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ error: "Database error", details: error.message });
    }
};