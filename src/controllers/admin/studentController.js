import db from '../../config/db.js'; // assuming your db connection file is here

export const createStudent = async (req, res) => {
  const { first_name, last_name, email, phone, password, focus, health_concerns, session_type } = req.body;

  try {
    // Check if email already exists
    const [existingUser] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Insert new user with student role
    const [result] = await db.query(
      `INSERT INTO users (first_name, last_name, email, phone, password, role, focus, health_concerns, session_type) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        first_name,
        last_name,
        email,
        phone,
        "default", // Note: In production, this should be hashed
        'student',
        JSON.stringify(focus),
        JSON.stringify(health_concerns),
        JSON.stringify(session_type)
      ]
    );

    return res.status(201).json({
      message: 'Student created successfully',
      studentId: result.insertId
    });
  } catch (error) {
    console.error('Create Student Error:', error);
    return res.status(500).json({ message: 'Error creating student', error: error.message });
  }
};

// GET all students
export const getAllStudents = async (req, res) => {
  try {
    const [students] = await db.query("SELECT * FROM users WHERE role = 'student'");
    res.json(students);
  } catch (error) {
    console.error('Get All Students Error:', error);
    res.status(500).json({ message: 'Error fetching students' });
  }
};

// GET student by ID
export const getStudentById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query("SELECT * FROM users WHERE id = ? AND role = 'student'", [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Student not found' });
    res.json(rows[0]);
  } catch (error) {
    console.error('Get Student By ID Error:', error);
    res.status(500).json({ message: 'Error fetching student' });
  }
};

// UPDATE student
export const updateStudent = async (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, email, phone, focus, health_concerns, session_type, is_verified } = req.body;

  try {
    const [student] = await db.query("SELECT * FROM users WHERE id = ? AND role = 'student'", [id]);
    if (student.length === 0) return res.status(404).json({ message: 'Student not found' });

    await db.query(
      `UPDATE users 
       SET first_name = ?, last_name = ?, email = ?, phone = ?, is_verified = ?, focus = ?, health_concerns = ?, session_type = ? 
       WHERE id = ?`,
      [first_name, last_name, email, phone, is_verified, JSON.stringify(focus), JSON.stringify(health_concerns), JSON.stringify(session_type), id]
    );

    res.json({ message: 'Student updated successfully' });
  } catch (error) {
    console.error('Update Student Error:', error);
    res.status(500).json({ message: 'Error updating student' });
  }
};

// DELETE student
export const deleteStudent = async (req, res) => {
  const { id } = req.params;
  try {
    const [student] = await db.query("SELECT * FROM users WHERE id = ? AND role = 'student'", [id]);
    if (student.length === 0) return res.status(404).json({ message: 'Student not found' });

    await db.query("DELETE FROM users WHERE id = ?", [id]);
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Delete Student Error:', error);
    res.status(500).json({ message: 'Error deleting student' });
  }
};
