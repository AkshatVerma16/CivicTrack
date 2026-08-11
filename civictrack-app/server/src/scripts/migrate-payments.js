import { getPool } from '../db.js'

async function migrate() {
  const connection = await getPool().getConnection()
  try {
    console.log('Starting payments migration...')
    
    // Add bank details to vendors table
    try {
      await connection.query(`
        ALTER TABLE vendors 
        ADD COLUMN bank_name VARCHAR(255) DEFAULT NULL,
        ADD COLUMN account_number VARCHAR(255) DEFAULT NULL,
        ADD COLUMN ifsc_code VARCHAR(255) DEFAULT NULL
      `)
      console.log('Added bank columns to vendors table.')
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('Bank columns already exist in vendors table.')
      } else {
        throw e
      }
    }

    // Create payments table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        bid_id INT NOT NULL,
        task_id BIGINT UNSIGNED NOT NULL,
        vendor_id INT UNSIGNED NOT NULL,
        ministry_id INT UNSIGNED NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        bank_details JSON NOT NULL,
        status ENUM('pending_approval', 'paid') DEFAULT 'pending_approval',
        transaction_id VARCHAR(255) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (bid_id) REFERENCES bids(id) ON DELETE CASCADE,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
        FOREIGN KEY (ministry_id) REFERENCES ministries(id) ON DELETE CASCADE
      )
    `)
    console.log('Created payments table.')
    
    console.log('Migration successful!')
  } catch (error) {
    console.error('Migration failed:', error)
  } finally {
    connection.release()
    process.exit(0)
  }
}

migrate()
