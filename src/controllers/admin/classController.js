import db from '../../config/db.js';

// Create
export const createClass = async (req, res) => {
  const { title, subtitle, description, duration, max_participants, level, recurring_days, user_id } = req.body;
  try {
    await db.query(
      `INSERT INTO classes (title, subtitle, description, duration, max_participants, level, recurring_days, user_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, subtitle, description, duration, max_participants, level, JSON.stringify(recurring_days), user_id]
    );
    return res.status(201).json({ message: 'Class created successfully' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Get All
export const getAllClasses = async (req, res) => {
  try {
    const [classes] = await db.query(`
      SELECT c.*, 
        u.id as user_id,
        u.first_name,
        u.last_name
      FROM classes c
      LEFT JOIN users u ON c.user_id = u.id
      ORDER BY c.created_at DESC
    `);
    return res.json(classes);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Get by ID
export const getClassById = async (req, res) => {
  try {
    const [result] = await db.query(`SELECT * FROM classes WHERE id = ?`, [req.params.id]);
    return res.json(result[0]);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Update
export const updateClass = async (req, res) => {
  const { title, subtitle, description, duration, max_participants, level, recurring_days, user_id } = req.body;
  try {
    await db.query(
      `UPDATE classes SET 
        title = ?, 
        subtitle = ?, 
        description = ?, 
        duration = ?, 
        max_participants = ?, 
        level = ?, 
        recurring_days = ?, 
        user_id = ? 
      WHERE id = ?`,
      [title, subtitle, description, duration, max_participants, level, JSON.stringify(recurring_days), user_id, req.params.id]
    );
    return res.json({ message: 'Class updated successfully' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Delete
export const deleteClass = async (req, res) => {
  try {
    await db.query(`DELETE FROM classes WHERE id = ?`, [req.params.id]);
    return res.json({ message: 'Class deleted successfully' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
