import db from "../config/db.js";
import { formatDate, formatTime, getNextInstanceDate, getDayOfWeek } from "../utils/dateUtils.js";

/**
 * Create a new class with enhanced recurrence options
 */
export const createClass = async (req, res) => {
  const { 
    user_id, 
    title, 
    subtitle, 
    description, 
    max_participants, 
    duration, 
    level,
    start_date,
    start_time,
    is_recurring,
    recurrence_type,
    recurring_days,
    recurring_interval,
    recurring_end_date,
    reminder_enabled,
    reminder_minutes_before,
    meeting_link
  } = req.body;

  // Validate required fields
  if (!user_id || !title || !start_date || !start_time) {
    return res.status(400).json({ 
      success: false, 
      message: "Required fields missing: user_id, title, start_date, and start_time are required" 
    });
  }

  try {
    // Set default values
    const participants = max_participants || 20;
    const classDuration = duration || 60;
    const classLevel = level || 'Beginner';
    const isRecurring = is_recurring || 0;
    const recurrenceType = recurrence_type || 'none';
    const recurringInterval = recurring_interval || 1;
    const reminderEnabled = reminder_enabled === undefined ? 1 : reminder_enabled;
    const reminderMinutesBefore = reminder_minutes_before || 30;

    // Insert data into the classes table
    const [result] = await db.execute(
      `INSERT INTO classes (
        user_id, 
        title, 
        subtitle, 
        description, 
        max_participants, 
        duration, 
        level,
        start_date,
        start_time,
        is_recurring,
        recurrence_type,
        recurring_days,
        recurring_interval,
        recurring_end_date,
        reminder_enabled,
        reminder_minutes_before,
        meeting_link
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id, 
        title, 
        subtitle || '', 
        description || '', 
        participants, 
        classDuration, 
        classLevel,
        formatDate(new Date(start_date)),
        start_time,
        isRecurring,
        recurrenceType,
        JSON.stringify(recurring_days || []),
        recurringInterval,
        recurring_end_date ? formatDate(new Date(recurring_end_date)) : null,
        reminderEnabled,
        reminderMinutesBefore,
        meeting_link || ''
      ]
    );

    // Get the inserted class
    const [newClass] = await db.execute(
      "SELECT * FROM classes WHERE id = ?",
      [result.insertId]
    );

    res.status(201).json({ 
      success: true, 
      message: "Class created successfully", 
      data: newClass[0] 
    });
  } catch (error) {
    console.error("Error creating class:", error);
    res.status(500).json({ 
      success: false, 
      message: "Database error", 
      error: error.message 
    });
  }
};

/**
 * Get all classes for a teacher with their exceptions
 */
export const getTeacherClasses = async (req, res) => {
  const { teacher_id } = req.params;

  try {
    // First get all classes for this teacher
    const [classes] = await db.execute(
      "SELECT * FROM classes WHERE user_id = ? ORDER BY created_at DESC",
      [teacher_id]
    );

    // If no classes found, return empty array
    if (classes.length === 0) {
      return res.status(200).json({ 
        success: true, 
        data: [] 
      });
    }

    // Get all class IDs to fetch exceptions
    const classIds = classes.map(classItem => classItem.id);
    
    // Get all exceptions for these classes in a single query
    const [exceptions] = await db.execute(
      `SELECT * FROM class_exceptions WHERE class_id IN (${classIds.map(() => '?').join(',')}) ORDER BY exception_date`,
      [...classIds]
    );

    // Group exceptions by class_id
    const exceptionsMap = {};
    exceptions.forEach(exception => {
      if (!exceptionsMap[exception.class_id]) {
        exceptionsMap[exception.class_id] = [];
      }
      exceptionsMap[exception.class_id].push(exception);
    });

    // Add exceptions to each class
    const classesWithExceptions = classes.map(classItem => {
      return {
        ...classItem,
        exceptions: exceptionsMap[classItem.id] || []
      };
    });

    res.status(200).json({ 
      success: true, 
      data: classesWithExceptions 
    });
  } catch (error) {
    console.error("Error fetching teacher classes with exceptions:", error);
    res.status(500).json({ 
      success: false, 
      message: "Database error", 
      error: error.message 
    });
  }
};

/**
 * Get a single class by ID
 */
export const getClassById = async (req, res) => {
  const { class_id } = req.params;

  try {
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

    // Get exceptions for this class
    const [exceptions] = await db.execute(
      "SELECT * FROM class_exceptions WHERE class_id = ?",
      [class_id]
    );

    res.status(200).json({ 
      success: true, 
      data: {
        ...classData[0],
        exceptions
      }
    });
  } catch (error) {
    console.error("Error fetching class:", error);
    res.status(500).json({ 
      success: false, 
      message: "Database error", 
      error: error.message 
    });
  }
};

/**
 * Update a class
 */
export const updateClass = async (req, res) => {
  const { class_id } = req.params;
  const { 
    title, 
    subtitle, 
    description, 
    max_participants, 
    duration, 
    level,
    start_date,
    start_time,
    is_recurring,
    recurrence_type,
    recurring_days,
    recurring_interval,
    recurring_end_date,
    reminder_enabled,
    reminder_minutes_before,
    is_active,
    update_type,
    meeting_link
  } = req.body;

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

    const existingClass = classData[0];

    // Handle different update types
    if (update_type === 'single_instance' && existingClass.is_recurring) {
      // Create an exception for this instance
      const exceptionDate = req.body.exception_date;
      
      if (!exceptionDate) {
        return res.status(400).json({ 
          success: false, 
          message: "exception_date is required for single instance updates" 
        });
      }

      // Check if exception already exists
      const [existingException] = await db.execute(
        "SELECT * FROM class_exceptions WHERE class_id = ? AND exception_date = ?",
        [class_id, exceptionDate]
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
            'modified',
            start_time || existingClass.start_time,
            duration || existingClass.duration,
            description || '',
            class_id,
            exceptionDate
          ]
        );
      } else {
        // Create new exception
        await db.execute(
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
            exceptionDate,
            'modified',
            start_time || existingClass.start_time,
            duration || existingClass.duration,
            description || ''
          ]
        );
      }

      res.status(200).json({ 
        success: true, 
        message: "Class instance updated successfully" 
      });
    } else if (update_type === 'future_instances' && existingClass.is_recurring) {
      // End the current recurring series at the split date
      const splitDate = req.body.split_date;
      
      if (!splitDate) {
        return res.status(400).json({ 
          success: false, 
          message: "split_date is required for future instance updates" 
        });
      }

      // Update the end date of the current series
      await db.execute(
        "UPDATE classes SET recurring_end_date = ? WHERE id = ?",
        [splitDate, class_id]
      );

      // Create a new series starting from the split date
      const [result] = await db.execute(
        `INSERT INTO classes (
          user_id, 
          title, 
          subtitle, 
          description, 
          max_participants, 
          duration, 
          level,
          formatDate(new Date(start_date)),
          start_time,
          is_recurring,
          recurrence_type,
          recurring_days,
          recurring_interval,
          recurring_end_date,
          reminder_enabled,
          reminder_minutes_before
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          existingClass.user_id,
          title || existingClass.title,
          subtitle || existingClass.subtitle,
          description || existingClass.description,
          max_participants || existingClass.max_participants,
          duration || existingClass.duration,
          level || existingClass.level,
          splitDate,
          start_time || existingClass.start_time,
          is_recurring !== undefined ? is_recurring : existingClass.is_recurring,
          recurrence_type || existingClass.recurrence_type,
          JSON.stringify(recurring_days || JSON.parse(existingClass.recurring_days || '[]')),
          recurring_interval || existingClass.recurring_interval,
          recurring_end_date ? formatDate(new Date(recurring_end_date)) : existingClass.recurring_end_date,
          reminder_enabled !== undefined ? reminder_enabled : existingClass.reminder_enabled,
          reminder_minutes_before || existingClass.reminder_minutes_before
        ]
      );

      // Get the new class
      const [newClass] = await db.execute(
        "SELECT * FROM classes WHERE id = ?",
        [result.insertId]
      );

      res.status(200).json({ 
        success: true, 
        message: "Future class instances updated successfully",
        data: newClass[0]
      });
    } else {
      // Regular update of the entire class
      await db.execute(
        `UPDATE classes SET
          title = ?,
          subtitle = ?,
          description = ?,
          max_participants = ?,
          duration = ?,
          level = ?,
          start_date = ?,
          start_time = ?,
          is_recurring = ?,
          recurrence_type = ?,
          recurring_days = ?,
          recurring_interval = ?,
          recurring_end_date = ?,
          reminder_enabled = ?,
          reminder_minutes_before = ?,
          is_active = ?,
          meeting_link = ?
        WHERE id = ?`,
        [
          title || existingClass.title,
          subtitle || existingClass.subtitle,
          description || existingClass.description,
          max_participants || existingClass.max_participants,
          duration || existingClass.duration,
          level || existingClass.level,
          start_date ? formatDate(new Date(start_date)) : existingClass.start_date,
          start_time || existingClass.start_time,
          is_recurring !== undefined ? is_recurring : existingClass.is_recurring,
          recurrence_type || existingClass.recurrence_type,
          recurring_days ? JSON.stringify(recurring_days) : existingClass.recurring_days,
          recurring_interval || existingClass.recurring_interval,
          recurring_end_date ? formatDate(new Date(recurring_end_date)) : existingClass.recurring_end_date,
          reminder_enabled !== undefined ? reminder_enabled : existingClass.reminder_enabled,
          reminder_minutes_before || existingClass.reminder_minutes_before,
          is_active !== undefined ? is_active : existingClass.is_active,
          meeting_link !== undefined ? meeting_link : existingClass.meeting_link,
          class_id
        ]
      );

      // Get the updated class
      const [updatedClass] = await db.execute(
        "SELECT * FROM classes WHERE id = ?",
        [class_id]
      );

      res.status(200).json({ 
        success: true, 
        message: "Class updated successfully",
        data: updatedClass[0]
      });
    }
  } catch (error) {
    console.error("Error updating class:", error);
    res.status(500).json({ 
      success: false, 
      message: "Database error", 
      error: error.message 
    });
  }
};

/**
 * Delete a class
 */
export const deleteClass = async (req, res) => {
  const { class_id } = req.params;
  const { delete_type, exception_date } = req.body;

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

    const existingClass = classData[0];

    // Handle different delete types
    if (delete_type === 'single_instance' && existingClass.is_recurring) {
      if (!exception_date) {
        return res.status(400).json({ 
          success: false, 
          message: "exception_date is required for single instance deletion" 
        });
      }

      // Create a cancellation exception
      await db.execute(
        `INSERT INTO class_exceptions (
          class_id, 
          exception_date, 
          exception_type, 
          reason
        ) VALUES (?, ?, ?, ?)`,
        [
          class_id,
          exception_date,
          'cancelled',
          req.body.reason || 'Cancelled by instructor'
        ]
      );

      res.status(200).json({ 
        success: true, 
        message: "Class instance cancelled successfully" 
      });
    } else {
      // Delete the entire class
      await db.execute(
        "DELETE FROM classes WHERE id = ?",
        [class_id]
      );

      res.status(200).json({ 
        success: true, 
        message: "Class deleted successfully" 
      });
    }
  } catch (error) {
    console.error("Error deleting class:", error);
    res.status(500).json({ 
      success: false, 
      message: "Database error", 
      error: error.message 
    });
  }
};

/**
 * Get class instances for a date range
 */
export const getClassInstances = async (req, res) => {
  const { start_date, end_date, teacher_id } = req.query;

  if (!start_date || !end_date) {
    return res.status(400).json({ 
      success: false, 
      message: "start_date and end_date are required" 
    });
  }

  try {
    // Get all classes that could have instances in the date range
    let query = `
      SELECT * FROM classes 
      WHERE 
        (
          (start_date BETWEEN ? AND ?) OR
          (is_recurring = 1 AND (recurring_end_date IS NULL OR recurring_end_date >= ?))
        )
    `;

    const queryParams = [start_date, end_date, start_date];

    // Add teacher filter if provided
    if (teacher_id) {
      query += " AND user_id = ?";
      queryParams.push(teacher_id);
    }

    const [classes] = await db.execute(query, queryParams);

    // Get all exceptions in the date range
    const [exceptions] = await db.execute(
      `SELECT * FROM class_exceptions 
       WHERE exception_date BETWEEN ? AND ?`,
      [start_date, end_date]
    );

    // Create a map of exceptions for quick lookup
    const exceptionMap = {};
    exceptions.forEach(exception => {
      const key = `${exception.class_id}_${exception.exception_date}`;
      exceptionMap[key] = exception;
    });

    // Generate instances for each class
    const allInstances = [];

    for (const classItem of classes) {
      const instances = generateClassInstances(
        classItem, 
        new Date(start_date), 
        new Date(end_date),
        exceptionMap
      );
      
      allInstances.push(...instances);
    }

    res.status(200).json({ 
      success: true, 
      data: allInstances 
    });
  } catch (error) {
    console.error("Error fetching class instances:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};

/**
 * Helper function to generate class instances for a date range
 */
function generateClassInstances(classData, startDate, endDate, exceptionMap = {}) {
  const instances = [];
  let currentDate = new Date(classData.start_date);
  
  // If the class starts after the end date, no instances to generate
  if (currentDate > endDate) {
    return [];
  }
  
  // If the class is not recurring, just check if it's in the range
  if (!classData.is_recurring) {
    if (currentDate >= startDate && currentDate <= endDate) {
      const instanceDate = formatDate(currentDate);
      const exceptionKey = `${classData.id}_${instanceDate}`;
      const exception = exceptionMap[exceptionKey];
      
      if (!exception || exception.exception_type !== 'cancelled') {
        instances.push(createInstanceObject(classData, currentDate, exception));
      }
    }
    return instances;
  }
  
  // For recurring classes
  const recurringEndDate = classData.recurring_end_date 
    ? new Date(classData.recurring_end_date) 
    : null;
  
  // Adjust start date if it's before the class start date
  if (startDate < currentDate) {
    startDate = currentDate;
  }
  
  // Start from the first occurrence on or after startDate
  while (currentDate < startDate) {
    currentDate = getNextInstanceDate(
      classData.recurrence_type,
      currentDate,
      JSON.parse(classData.recurring_days || '[]'),
      classData.recurring_interval
    );
  }
  
  // Generate instances until we reach the end date or recurring end date
  while (
    currentDate <= endDate && 
    (!recurringEndDate || currentDate <= recurringEndDate)
  ) {
    const instanceDate = formatDate(currentDate);
    const exceptionKey = `${classData.id}_${instanceDate}`;
    const exception = exceptionMap[exceptionKey];
    
    // Add instance unless it's cancelled
    if (!exception || exception.exception_type !== 'cancelled') {
      instances.push(createInstanceObject(classData, currentDate, exception));
    }
    
    // Move to next instance
    currentDate = getNextInstanceDate(
      classData.recurrence_type,
      currentDate,
      JSON.parse(classData.recurring_days || '[]'),
      classData.recurring_interval
    );
  }
  
  return instances;
}

/**
 * Helper function to create an instance object
 */
function createInstanceObject(classData, date, exception = null) {
  const instanceDate = formatDate(date);
  const dayOfWeek = getDayOfWeek(date);
  
  // Create base instance
  const instance = {
    id: `${classData.id}_${instanceDate}`,
    class_id: classData.id,
    title: classData.title,
    subtitle: classData.subtitle,
    description: classData.description,
    max_participants: classData.max_participants,
    duration: classData.duration,
    level: classData.level,
    user_id: classData.user_id,
    date: instanceDate,
    day_of_week: dayOfWeek,
    start_time: classData.start_time,
    is_recurring: classData.is_recurring,
    is_exception: !!exception,
    original_class: { ...classData }
  };
  
  // Apply exception modifications if needed
  if (exception && exception.exception_type === 'modified') {
    instance.start_time = exception.new_start_time || instance.start_time;
    instance.duration = exception.new_duration || instance.duration;
    instance.exception_reason = exception.reason;
  } else if (exception && exception.exception_type === 'rescheduled') {
    instance.start_time = exception.new_start_time;
    instance.exception_reason = exception.reason;
  }
  
  return instance;
}
