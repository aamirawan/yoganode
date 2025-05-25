import pool from "../config/db.js";

/**
 * Migration to add questionnaire_completed field to users table
 */
export const up = async () => {
  try {
    // Check if the column already exists
    const [columns] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'questionnaire_completed'
    `);

    // If column doesn't exist, add it
    if (columns.length === 0) {
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN questionnaire_completed BOOLEAN DEFAULT FALSE
      `);
      console.log("✅ Added questionnaire_completed column to users table");
    } else {
      console.log("⏩ questionnaire_completed column already exists in users table");
    }

    return true;
  } catch (error) {
    console.error("❌ Error in migration:", error);
    return false;
  }
};

/**
 * Rollback the migration
 */
export const down = async () => {
  try {
    await pool.query(`
      ALTER TABLE users 
      DROP COLUMN IF EXISTS questionnaire_completed
    `);
    console.log("✅ Removed questionnaire_completed column from users table");
    return true;
  } catch (error) {
    console.error("❌ Error in migration rollback:", error);
    return false;
  }
};

// Run the migration if this file is executed directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  up()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
