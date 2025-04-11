import db from "../config/db.js";
import notificationService from "../services/NotificationService.js";

export const reportIssue = async (req, res) => {
    const { user_id, title, description, priority } = req.body;

    try {
        // Insert issue report
        const [result] = await db.execute(
            "INSERT INTO issue_reports (user_id, title, description, priority) VALUES (?, ?, ?, ?)",
            [user_id, title, description, priority]
        );

        // Get user details for notification
        const [userDetails] = await db.execute(
            "SELECT * FROM users WHERE id = ?",
            [user_id]
        );

        // Send issue confirmation notification
        const user = {
            id: user_id,
            email: userDetails[0].email,
            phone: userDetails[0].phone
        };

        const issueDetails = {
            userName: `${userDetails[0].first_name} ${userDetails[0].last_name}`,
            issueId: result.insertId,
            title: title,
            description: description,
            priority: priority
        };

        await notificationService.sendIssueConfirmation(user, issueDetails);

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