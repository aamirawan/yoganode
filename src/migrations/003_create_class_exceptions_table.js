import db from '../config/db.js';
import { fileURLToPath } from 'url';

/**
 * Migration to create the class_exceptions table
 */
export const createClassExceptionsTable = async () => {
  try {
    console.log('Starting migration to create class_exceptions table...');
    
    // Check if the table already exists
    const [tables] = await db.execute("SHOW TABLES LIKE 'class_exceptions'");
    
    if (tables.length === 0) {
      console.log('Creating class_exceptions table...');
      
      // Create the class_exceptions table
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
          
          INDEX (class_id),
          INDEX (exception_date),
          FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
        )
      `);
      
      console.log('Successfully created class_exceptions table');
    } else {
      console.log('class_exceptions table already exists');
    }
    
    return { success: true, message: 'Migration completed successfully' };
  } catch (error) {
    console.error('Migration failed:', error);
    return { success: false, message: error.message };
  }
};

// Execute the migration if this file is run directly
if (import.meta.url && process.argv[1] === fileURLToPath(import.meta.url)) {
  createClassExceptionsTable()
    .then(result => {
      console.log(result.message);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Migration error:', error);
      process.exit(1);
    });
}

export default createClassExceptionsTable;
