import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') })

import mysql from 'mysql2/promise'

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'civictrack',
})

async function main() {
  try {
    // Get complaints id column type
    const [complaintCols] = await pool.query("SHOW COLUMNS FROM complaints WHERE Field = 'id'")
    console.log('complaints.id type:', complaintCols[0].Type)

    // Get users id column type
    const [userCols] = await pool.query("SHOW COLUMNS FROM users WHERE Field = 'id'")
    console.log('users.id type:', userCols[0].Type)

    // Now create bids table with matching types
    const complaintIdType = complaintCols[0].Type  // e.g. "bigint unsigned"
    const userIdType = userCols[0].Type            // e.g. "int unsigned"

    console.log('\nCreating bids table...')
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bids (
        id INT AUTO_INCREMENT PRIMARY KEY,
        complaint_id BIGINT UNSIGNED NOT NULL,
        vendor_id INT UNSIGNED NOT NULL,
        estimated_time INT NOT NULL,
        budget DECIMAL(12, 2) NOT NULL,
        status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
        FOREIGN KEY (vendor_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `)
    console.log('bids table created!')

    console.log('Creating reported_bids table...')
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reported_bids (
        id INT AUTO_INCREMENT PRIMARY KEY,
        bid_id INT NOT NULL,
        ministry_id INT UNSIGNED NOT NULL,
        reason TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (bid_id) REFERENCES bids(id) ON DELETE CASCADE,
        FOREIGN KEY (ministry_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `)
    console.log('reported_bids table created!')

    // Verify
    const [t1] = await pool.query("SHOW TABLES LIKE 'bids'")
    const [t2] = await pool.query("SHOW TABLES LIKE 'reported_bids'")
    console.log('\nbids exists:', t1.length > 0)
    console.log('reported_bids exists:', t2.length > 0)

  } catch (e) {
    console.error('Error:', e.message)
  } finally {
    await pool.end()
  }
}

main()
