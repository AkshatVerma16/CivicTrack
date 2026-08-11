import { runQuery } from '../db.js';

async function migrate() {
  console.log('Starting tasks table migration...');
  
  try {
    // Check if column exists first
    const checkUserConfirmed = await runQuery(`
      SELECT COUNT(*) as count 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'tasks' 
        AND COLUMN_NAME = 'user_confirmed_at'
    `);
    
    if (checkUserConfirmed[0].count === 0) {
      await runQuery('ALTER TABLE tasks ADD COLUMN user_confirmed_at DATETIME DEFAULT NULL');
      console.log('Added user_confirmed_at column to tasks table');
    } else {
      console.log('user_confirmed_at column already exists in tasks table');
    }
    
    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
