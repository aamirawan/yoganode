import { updateClassesTable } from './001_update_classes_table.js';
import { addIsActiveToClasses } from './002_add_is_active_to_classes.js';
import { createClassExceptionsTable } from './003_create_class_exceptions_table.js';
import { updateSubscriptionPackagesTable } from './004_update_subscription_packages.js';
import { addMeetingLinkToClasses } from './005_add_meeting_link_to_classes.js';
import { up as addQuestionnaireCompletedToUsers } from './006_add_questionnaire_completed_to_users.js';

/**
 * Run all migrations in sequence
 */
const runAllMigrations = async () => {
  try {
    console.log('Starting migrations...');
    
    // Run migrations in order
    const migrations = [
      { name: 'Update Classes Table', fn: updateClassesTable },
      { name: 'Add Is Active to Classes', fn: addIsActiveToClasses },
      { name: 'Create Class Exceptions Table', fn: createClassExceptionsTable },
      { name: 'Update Subscription Packages Table', fn: updateSubscriptionPackagesTable },
      { name: 'Add Meeting Link to Classes', fn: addMeetingLinkToClasses },
      { name: 'Add Questionnaire Completed to Users', fn: addQuestionnaireCompletedToUsers }
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
