import dotenv from 'dotenv'
import fs from 'fs'
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
    // Check if vendor_applications table exists
    const [rows] = await pool.query('SHOW TABLES LIKE "vendor_applications"')
    console.log('vendor_applications table exists:', rows.length > 0)

    if (rows.length === 0) {
      console.log('Creating vendor_applications table...')
      await pool.query(`
        CREATE TABLE IF NOT EXISTS vendor_applications (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          email VARCHAR(100) NOT NULL UNIQUE,
          phone VARCHAR(30) NOT NULL,
          company VARCHAR(100) NOT NULL,
          password VARCHAR(255) NOT NULL,
          status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `)
      console.log('vendor_applications table created successfully!')
    }

    // Also check complaints status enum includes all needed values
    const [cols] = await pool.query("SHOW COLUMNS FROM complaints WHERE Field = 'status'")
    console.log('complaints status column:', cols[0]?.Type)

  } catch (e) {
    console.error('Error:', e.message)
  } finally {
    await pool.end()
  }
}

main()
