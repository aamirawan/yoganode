import { updateClassesTable } from './001_update_classes_table.js';
import { updateSubscriptionPackagesTable } from './004_update_subscription_packages.js';

/**
 * Run all migrations in sequence
 */
const runAllMigrations = async () => {
  try {
    console.log('Starting migrations...');
    
    // Run migrations in order
    const migrations = [
      { name: 'Update Classes Table', fn: updateClassesTable },
      { name: 'Update Subscription Packages Table', fn: updateSubscriptionPackagesTable }
    ];
    
    for (const migration of migrations) {
      console.log(`Running migration: ${migration.name}`);
      const result = await migration.fn();
      
      if (!result.success) {
        console.error(`Migration ${migration.name} failed:`, result.error);
        process.exit(1);
      }
      
      console.log(`Migration ${migration.name} completed successfully`);
    }
    
    console.log('All migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration process failed:', error);
    process.exit(1);
  }
};

// Run migrations
runAllMigrations();
