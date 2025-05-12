import db from '../config/db.js';

/**
 * Migration to update the SubscriptionPackages table with type field
 * and ensure proper configuration for group and one-on-one packages
 */
export const updateSubscriptionPackagesTable = async () => {
  try {
    console.log('Starting SubscriptionPackages table migration...');
    
    // Check if the table exists
    const [tables] = await db.execute("SHOW TABLES LIKE 'SubscriptionPackages'");
    
    if (tables.length === 0) {
      console.log('Creating SubscriptionPackages table from scratch...');
      
      // Create the table with all fields including the new type field
      await db.execute(`
        CREATE TABLE SubscriptionPackages (
          id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          durationDays INT,
          price DECIMAL(10,2),
          freeTrialClasses INT DEFAULT 0,
          groupClasses INT DEFAULT 0,
          oneOnOneSessions INT DEFAULT 0,
          type ENUM('group', 'one-on-one') NOT NULL DEFAULT 'group',
          features JSON,
          isActive TINYINT(1) DEFAULT 1,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      
      console.log('SubscriptionPackages table created successfully');
      return { success: true };
    } else {
      console.log('SubscriptionPackages table exists, checking for type column...');
      
      // Check if the type column exists
      const [columns] = await db.execute("SHOW COLUMNS FROM SubscriptionPackages LIKE 'type'");
      
      if (columns.length === 0) {
        console.log('Adding type column to SubscriptionPackages table...');
        
        // Add the type column
        await db.execute(`
          ALTER TABLE SubscriptionPackages 
          ADD COLUMN type ENUM('group', 'one-on-one') NOT NULL DEFAULT 'group' 
          AFTER oneOnOneSessions
        `);
        
        console.log('Type column added successfully');
        
        // Update existing packages based on their configuration
        console.log('Updating existing packages with appropriate types...');
        
        // Set packages with oneOnOneSessions > 0 to 'one-on-one' type
        await db.execute(`
          UPDATE SubscriptionPackages 
          SET type = 'one-on-one' 
          WHERE oneOnOneSessions > 0
        `);
        
        // Set packages with groupClasses = 0 to 'group' type (unlimited group classes)
        await db.execute(`
          UPDATE SubscriptionPackages 
          SET type = 'group', 
              groupClasses = 0 
          WHERE oneOnOneSessions = 0
        `);
        
        console.log('Existing packages updated successfully');
      } else {
        console.log('Type column already exists, updating enum values...');
        
        // Update the type column to use only 'group' and 'one-on-one' values
        await db.execute(`
          ALTER TABLE SubscriptionPackages 
          MODIFY COLUMN type ENUM('group', 'one-on-one') NOT NULL DEFAULT 'group'
        `);
        
        // Update any packages with types other than 'group' or 'one-on-one'
        await db.execute(`
          UPDATE SubscriptionPackages 
          SET type = 'group' 
          WHERE type NOT IN ('group', 'one-on-one')
        `);
        
        console.log('Type column enum values updated successfully');
      }
      
      return { success: true };
    }
  } catch (error) {
    console.error('Error updating SubscriptionPackages table:', error);
    return { success: false, error };
  }
};

// Run the migration if this file is executed directly
if (process.argv[1].includes('004_update_subscription_packages.js')) {
  updateSubscriptionPackagesTable()
    .then(result => {
      if (result.success) {
        console.log('Migration completed successfully');
        process.exit(0);
      } else {
        console.error('Migration failed:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Migration failed with an exception:', error);
      process.exit(1);
    });
}
