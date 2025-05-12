import db from "../config/db.js";
import { formatDate } from "../utils/dateUtils.js";

/**
 * Create a new class exception (cancel, reschedule, or modify a class instance)
 */
export const createClassException = async (req, res) => {
  const { class_id } = req.params;
  const { 
    exception_date, 
    exception_type, 
    new_start_time, 
    new_duration, 
    reason 
  } = req.body;

  // Validate required fields
  if (!class_id || !exception_date || !exception_type) {
    return res.status(400).json({ 
      success: false, 
      message: "Required fields missing: class_id, exception_date, and exception_type are required" 
    });
  }

  // Validate exception type
  const validExceptionTypes = ['cancelled', 'rescheduled', 'modified'];
  if (!validExceptionTypes.includes(exception_type)) {
    return res.status(400).json({ 
      success: false, 
      message: `Invalid exception type. Must be one of: ${validExceptionTypes.join(', ')}` 
    });
  }

  try {
    // Check if class exists
    const [classData] = await db.execute(
      "SELECT * FROM classes WHERE id = ?",
      [class_id]
    );

    if (classData.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Class not found" 
      });
    }

    // Check if exception already exists
    const [existingException] = await db.execute(
      "SELECT * FROM class_exceptions WHERE class_id = ? AND exception_date = ?",
      [class_id, exception_date]
    );

    if (existingException.length > 0) {
      // Update existing exception
      await db.execute(
        `UPDATE class_exceptions SET 
          exception_type = ?, 
          new_start_time = ?, 
          new_duration = ?, 
          reason = ?
        WHERE class_id = ? AND exception_date = ?`,
        [
          exception_type,
          new_start_time || null,
          new_duration || null,
          reason || '',
          class_id,
          exception_date
        ]
      );

      // Get the updated exception
      const [updatedException] = await db.execute(
        "SELECT * FROM class_exceptions WHERE class_id = ? AND exception_date = ?",
        [class_id, exception_date]
      );

      return res.status(200).json({ 
        success: true, 
        message: "Class exception updated successfully", 
        data: updatedException[0] 
      });
    } else {
      // Create new exception
      const [result] = await db.execute(
        `INSERT INTO class_exceptions (
          class_id, 
          exception_date, 
          exception_type, 
          new_start_time, 
          new_duration, 
          reason
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          class_id,
          exception_date,
          exception_type,
          new_start_time || null,
          new_duration || null,
          reason || ''
        ]
      );

      // Get the inserted exception
      const [newException] = await db.execute(
        "SELECT * FROM class_exceptions WHERE id = ?",
        [result.insertId]
      );

      return res.status(201).json({ 
        success: true, 
        message: "Class exception created successfully", 
        data: newException[0] 
      });
    }
  } catch (error) {
    console.error("Error creating class exception:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Database error", 
      error: error.message 
    });
  }
};

/**
 * Get all exceptions for a class
 */
export const getClassExceptions = async (req, res) => {
  const { class_id } = req.params;

  try {
    const [exceptions] = await db.execute(
      "SELECT * FROM class_exceptions WHERE class_id = ? ORDER BY exception_date",
      [class_id]
    );

    return res.status(200).json({ 
      success: true, 
      data: exceptions 
    });
  } catch (error) {
    console.error("Error fetching class exceptions:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Database error", 
      error: error.message 
    });
  }
};

/**
 * Delete a class exception
 */
export const deleteClassException = async (req, res) => {
  const { class_id, exception_id } = req.params;

  try {
    // Check if exception exists and belongs to the specified class
    const [exception] = await db.execute(
      "SELECT * FROM class_exceptions WHERE id = ? AND class_id = ?",
      [exception_id, class_id]
    );

    if (exception.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Exception not found or does not belong to the specified class" 
      });
    }

    // Delete the exception
    await db.execute(
      "DELETE FROM class_exceptions WHERE id = ?",
      [exception_id]
    );

    return res.status(200).json({ 
      success: true, 
      message: "Class exception deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting class exception:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Database error", 
      error: error.message 
    });
  }
};
