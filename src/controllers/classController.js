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

// Get teachers classes
export const getAllClasses = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.execute(`SELECT * FROM classes WHERE user_id = ?`, [id]);
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ error: "Database error", details: error.message });
    }
};

// Get available classes for students
export const getAvailableClasses = async (req, res) => {
    try {
        //const { date, teacherId, focusArea, sessionType } = req.query;

        let query = `
            SELECT 
                classes.id AS class_id, 
                users.id AS user_id, 
                teachers.id AS teacher_id, 
                classes.*, 
                users.*, 
                teachers.*
            FROM classes
            LEFT JOIN users ON classes.user_id = users.id
            LEFT JOIN teachers ON teachers.user_id = users.id
        `;
        const [classes] = await db.execute(query);

        res.status(200).json({ success: true, data: classes });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

export const getOneOnOneSessionClasses = async (req, res) => {
    const { teacher_id } = req.query;
    
    // Check if both teacher_id and date are provided
    if (!teacher_id) {
        return res.status(400).json({ message: "teacher_id is required." });
    }
    
    //console.log('Teacher ID:', teacher_id);
    //console.log('Date:', date);

    try {
        // SQL query to fetch one-on-one session data with teacher_id and date filter
        const query = `
            SELECT 
                teacher_availability.id AS class_id,
                users.id AS user_id,
                teachers.user_id AS teacher_id,
                teacher_availability.*,
                users.*,
                teachers.*
            FROM teacher_availability
            LEFT JOIN users ON teacher_availability.user_id = users.id
            LEFT JOIN teachers ON teachers.user_id = users.id
            WHERE teachers.user_id = ?`;


        // Execute the query using parameterized values to avoid SQL injection
        const [rows] = await db.execute(query, [teacher_id]);

        // Check if no rows were found
        if (rows.length === 0) {
            return res.status(200).json({ message: "No sessions found for this teacher" });
        }

        // Return the results as a JSON response
        res.status(200).json(rows);
    } catch (error) {
        // Enhanced error handling for debugging
        console.error('Database error:', error);
        res.status(500).json({ error: "Database error", details: error.message });
    }
};