import db from '../config/db.js';
import { fileURLToPath } from 'url';

/**
 * Migration to add is_active column to the classes table
 */
export const addIsActiveToClasses = async () => {
  try {
    console.log('Starting migration to add is_active column to classes table...');
    
    // Check if the column already exists
    const [columns] = await db.execute("SHOW COLUMNS FROM classes LIKE 'is_active'");
    
    if (columns.length === 0) {
      console.log('Adding is_active column to classes table...');
      
      // Add the is_active column with default value TRUE
      await db.execute(`
        ALTER TABLE classes 
        ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;
      `);
      
      console.log('Successfully added is_active column to classes table');
    } else {
      console.log('is_active column already exists in classes table');
    }
    
    return { success: true, message: 'Migration completed successfully' };
  } catch (error) {
    console.error('Migration failed:', error);
    return { success: false, message: error.message };
  }
};

// Execute the migration if this file is run directly
if (import.meta.url && process.argv[1] === fileURLToPath(import.meta.url)) {
  addIsActiveToClasses()
    .then(result => {
      console.log(result.message);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Migration error:', error);
      process.exit(1);
    });
}

export default addIsActiveToClasses;
