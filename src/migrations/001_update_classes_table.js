import db from '../config/db.js';

/**
 * Migration to update the classes table with enhanced recurrence functionality
 */
export const updateClassesTable = async () => {
  try {
    console.log('Starting classes table migration...');
    
    // Check if the table exists
    const [tables] = await db.execute("SHOW TABLES LIKE 'classes'");
    
    if (tables.length === 0) {
      console.log('Creating classes table from scratch...');
      
      // Create the table with all new fields
      await db.execute(`
        CREATE TABLE classes (
          id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          title VARCHAR(255) NOT NULL,
          subtitle VARCHAR(255),
          description TEXT,
          max_participants INT NOT NULL DEFAULT 20,
          duration INT NOT NULL DEFAULT 60,
          level ENUM('Beginner', 'Intermediate', 'Advanced') NOT NULL DEFAULT 'Beginner',
          
          -- Timing fields
          start_date DATE NOT NULL,
          start_time TIME NOT NULL,
          
          -- Recurring settings
          is_recurring TINYINT(1) DEFAULT 0,
          recurrence_type ENUM('none', 'daily', 'weekly', 'monthly', 'custom') DEFAULT 'none',
          recurring_days JSON,
          recurring_interval INT DEFAULT 1,
          recurring_end_date DATE,
          
          -- Notification settings
          reminder_enabled TINYINT(1) DEFAULT 1,
          reminder_minutes_before INT DEFAULT 30,
          
          -- Original fields for backward compatibility
          recurring_days_old JSON,
          
          -- Timestamps
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          
          INDEX (user_id),
          INDEX (start_date),
          INDEX (is_recurring)
        )
      `);
      
      console.log('Classes table created successfully');
    } else {
      console.log('Altering existing classes table...');
      
      // Check if columns already exist
      const [columns] = await db.execute("SHOW COLUMNS FROM classes");
      const columnNames = columns.map(col => col.Field);
      
      // Add new columns if they don't exist
      if (!columnNames.includes('start_date')) {
        await db.execute("ALTER TABLE classes ADD COLUMN start_date DATE AFTER level");
      }
      
      if (!columnNames.includes('start_time')) {
        await db.execute("ALTER TABLE classes ADD COLUMN start_time TIME AFTER start_date");
      }
      
      if (!columnNames.includes('recurrence_type')) {
        await db.execute("ALTER TABLE classes ADD COLUMN recurrence_type ENUM('none', 'daily', 'weekly', 'monthly', 'custom') DEFAULT 'none' AFTER is_recurring");
      }
      
      if (!columnNames.includes('recurring_interval')) {
        await db.execute("ALTER TABLE classes ADD COLUMN recurring_interval INT DEFAULT 1 AFTER recurring_days");
      }
      
      if (!columnNames.includes('recurring_end_date')) {
        await db.execute("ALTER TABLE classes ADD COLUMN recurring_end_date DATE AFTER recurring_interval");
      }
      
      if (!columnNames.includes('reminder_enabled')) {
        await db.execute("ALTER TABLE classes ADD COLUMN reminder_enabled TINYINT(1) DEFAULT 1 AFTER recurring_end_date");
      }
      
      if (!columnNames.includes('reminder_minutes_before')) {
        await db.execute("ALTER TABLE classes ADD COLUMN reminder_minutes_before INT DEFAULT 30 AFTER reminder_enabled");
      }
      
      // Rename original recurring_days to recurring_days_old for backward compatibility
      if (columnNames.includes('recurring_days') && !columnNames.includes('recurring_days_old')) {
        await db.execute("ALTER TABLE classes ADD COLUMN recurring_days_old JSON");
        await db.execute("UPDATE classes SET recurring_days_old = recurring_days WHERE recurring_days IS NOT NULL");
      }
      
      console.log('Classes table updated successfully');
    }
    
    // Check if class_exceptions table exists
    const [exceptionTables] = await db.execute("SHOW TABLES LIKE 'class_exceptions'");
    
    if (exceptionTables.length === 0) {
      console.log('Creating class_exceptions table...');
      
      await db.execute(`
        CREATE TABLE class_exceptions (
          id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
          class_id INT NOT NULL,
          exception_date DATE NOT NULL,
          exception_type ENUM('cancelled', 'rescheduled', 'modified') NOT NULL,
          new_start_time TIME,
          new_duration INT,
          reason TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
          UNIQUE KEY (class_id, exception_date)
        )
      `);
      
      console.log('Class exceptions table created successfully');
    }
    
    console.log('Migration completed successfully');
    return { success: true, message: 'Migration completed successfully' };
  } catch (error) {
    console.error('Migration failed:', error);
    return { success: false, error: error.message };
  }
};

// Run the migration if this file is executed directly
if (process.argv[1].includes('001_update_classes_table.js')) {
  updateClassesTable()
    .then(result => {
      console.log(result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(err => {
      console.error('Unhandled error during migration:', err);
      process.exit(1);
    });
}
