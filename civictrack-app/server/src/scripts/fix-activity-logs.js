import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import mysql from 'mysql2/promise'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') })

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'civictrack',
})

async function fixLogs() {
  try {
    console.log('Checking activity_logs table...')
    const [rows] = await pool.query('SHOW TABLES LIKE "activity_logs"')
    
    if (rows.length === 0) {
      console.log('Creating activity_logs table...')
      await pool.query(`
        CREATE TABLE activity_logs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT UNSIGNED,
          action VARCHAR(255) NOT NULL,
          details TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        )
      `)
      console.log('activity_logs table created.')
      
      // Seed some dummy logs
      console.log('Seeding initial logs...')
      await pool.query(`
        INSERT INTO activity_logs (action, details) VALUES 
        ('System Start', 'Application initialized and database connected.'),
        ('Table Check', 'Verified existence of core tables.')
      `)
    } else {
        console.log('activity_logs table already exists.')
        // Check if it has data
        const [logs] = await pool.query('SELECT COUNT(*) as count FROM activity_logs')
        if (logs[0].count === 0) {
            console.log('Seeding initial logs into empty table...')
            await pool.query(`
                INSERT INTO activity_logs (action, details) VALUES 
                ('System Start', 'Application initialized and database connected.'),
                ('Table Check', 'Verified existence of core tables.')
            `)
        }
    }
    
    console.log('Activity logs fix complete.')
  } catch (e) {
    console.error('Error:', e)
  } finally {
    await pool.end()
  }
}

fixLogs()
