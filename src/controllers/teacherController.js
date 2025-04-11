import db from "../config/db.js";

export const createTeacherProfile = async (req, res) => {
    const { first_name, last_name, email, phone, profile_photo, certifications } = req.body;

    const connection = await db.getConnection(); // Get a connection from the pool
    try {
        // Start a transaction
        await connection.beginTransaction();

        // Check if a user with this email already exists
        const [userResult] = await connection.execute("SELECT id FROM users WHERE email = ?", [email]);

        let userId;

        if (userResult.length === 0) {
            // If no user exists, create a new user
            const [userInsertResult] = await connection.execute(
                "INSERT INTO users (first_name, last_name, email, phone) VALUES (?, ?, ?, ?)",
                [first_name, last_name, email, phone]
            );
            userId = userInsertResult.insertId;
        } else {
            // If user exists, update the existing user's information
            userId = userResult[0].id;
            await connection.execute(
                "UPDATE users SET first_name = ?, last_name = ?, email = ? WHERE id = ?",
                [first_name, last_name, email, userId]
            );
        }

        // Check if the teacher profile already exists for this user
        const [teacherResult] = await connection.execute("SELECT id FROM teachers WHERE user_id = ?", [userId]);

        if (teacherResult.length === 0) {
            // If no teacher profile exists, create a new teacher profile
            await connection.execute(
                "INSERT INTO teachers (user_id, profile_photo, certifications) VALUES (?, ?, ?)",
                [userId, profile_photo, JSON.stringify(certifications)]
            );
            // Commit transaction
            await connection.commit();
            res.status(201).json({ message: "Teacher profile created successfully", userId });
        } else {
            // If teacher profile exists, update the existing teacher profile
            await connection.execute(
                "UPDATE teachers SET profile_photo = ?, certifications = ? WHERE user_id = ?",
                [profile_photo, JSON.stringify(certifications), userId]
            );
            // Commit transaction
            await connection.commit();
            res.status(200).json({ message: "Teacher profile updated successfully", userId });
        }

    } catch (error) {
        // If any error occurs, rollback the transaction
        await connection.rollback();
        res.status(500).json({ error: "Database error", details: error.message });
    } finally {
        // Release the connection back to the pool
        connection.release();
    }
};

export const getTeacherProfile = async (req, res) => {
    const { id } = req.params;

    try {
        // Perform a JOIN query to fetch data from both 'teachers' and 'users' tables
        const [rows] = await db.execute(
            `SELECT teachers.*, users.* 
            FROM users 
            LEFT JOIN teachers ON teachers.user_id = users.id 
            WHERE users.id = ?`, 
            [id]
        );

        if (rows.length === 0) return res.status(404).json({ error: "Teacher not found" });

        // If found, send back the teacher data along with the related user data
        res.status(200).json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: "Database error", details: error.message });
    }
};

export const getTeachersProfiles = async (req, res) => {
    try {
        // Perform a JOIN query to fetch data from both 'teachers' and 'users' tables
        const [rows] = await db.execute(
            `SELECT teachers.*, users.* 
            FROM users 
            LEFT JOIN teachers ON teachers.user_id = users.id 
            WHERE users.role = 'teacher'`
        );

        if (rows.length === 0) return res.status(404).json({ error: "Teacher not found" });

        // If found, send back the teacher data along with the related user data
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ error: "Database error", details: error.message });
    }
};
