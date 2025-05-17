import db from '../config/db.js';
import { fileURLToPath } from 'url';

/**
 * Migration to add meeting_link column to the classes table
 */
export const addMeetingLinkToClasses = async () => {
  try {
    console.log('Starting migration to add meeting_link column to classes table...');
    
    // Check if the column already exists
    const [columns] = await db.execute("SHOW COLUMNS FROM classes LIKE 'meeting_link'");
    
    if (columns.length === 0) {
      console.log('Adding meeting_link column to classes table...');
      
      // Add the meeting_link column
      await db.execute(`
        ALTER TABLE classes 
        ADD COLUMN meeting_link VARCHAR(255) NULL COMMENT 'URL for online class meeting';
      `);
      
      console.log('Successfully added meeting_link column to classes table');
    } else {
      console.log('meeting_link column already exists in classes table');
    }
    
    return { success: true, message: 'Migration completed successfully' };
  } catch (error) {
    console.error('Migration failed:', error);
    return { success: false, message: error.message };
  }
};

// Execute the migration if this file is run directly
if (import.meta.url && process.argv[1] === fileURLToPath(import.meta.url)) {
  addMeetingLinkToClasses()
    .then(result => {
      console.log(result.message);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Migration error:', error);
      process.exit(1);
    });
}

export default addMeetingLinkToClasses;
