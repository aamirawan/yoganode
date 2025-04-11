// controllers/admin/teacherController.js
import db from '../../config/db.js';

// Get all teacher applications (with user info)
export const getAllTeachers = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT u.*, t.profile_photo, t.certifications, t.experience, t.id as teacher_id
      FROM users u
      LEFT JOIN teachers t ON u.id = t.user_id
      WHERE u.role = 'teacher'
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch teachers', details: err });
  }
};

// Get single teacher profile
export const getTeacherById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query(`
      SELECT u.*, t.*
      FROM users u
      LEFT JOIN teachers t ON u.id = t.user_id
      WHERE u.id = ?
    `, [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Teacher not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch teacher', details: err });
  }
};

// Update teacher profile
export const updateTeacherProfile = async (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, phone, focus, health_concerns, session_type, certifications, profile_photo } = req.body;

  try {
    await db.query(`
      UPDATE users SET 
        first_name = ?, 
        last_name = ?, 
        phone = ?, 
        focus = ?, 
        health_concerns = ?, 
        session_type = ? 
      WHERE id = ?
    `, [
      first_name, 
      last_name, 
      phone, 
      JSON.stringify(focus), 
      JSON.stringify(health_concerns), 
      JSON.stringify(session_type), 
      id
    ]);

    await db.query(`
      UPDATE teachers SET certifications = ?, profile_photo = ? WHERE user_id = ?
    `, [JSON.stringify(certifications), profile_photo, id]);

    return res.json({ message: 'Teacher profile updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update teacher profile', details: err });
  }
};

// Delete teacher
export const deleteTeacher = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query(`DELETE FROM teachers WHERE user_id = ?`, [id]);
    await db.query(`DELETE FROM users WHERE id = ?`, [id]);
    res.json({ message: 'Teacher deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete teacher', details: err });
  }
};

// Approve teacher
export const approveTeacher = async (req, res) => {
  const { userId } = req.params;
  try {
    await db.query(`UPDATE users SET is_verified = true WHERE id = ? AND role = 'teacher'`, [userId]);
    res.json({ message: 'Teacher approved successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to approve teacher', details: err });
  }
};

// Reject teacher
export const rejectTeacher = async (req, res) => {
  const { userId } = req.params;
  try {
    await db.query(`UPDATE users SET is_verified = false WHERE id = ? AND role = 'teacher'`, [userId]);
    res.json({ message: 'Teacher rejected successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject teacher', details: err });
  }
};
