import dotenv from 'dotenv'
import fs from 'fs'
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

async function checkTables() {
  try {
    const [tables] = await pool.query('SHOW TABLES')
    const tableNames = tables.map(t => Object.values(t)[0])
    console.log('Existing tables:', tableNames)

    if (!tableNames.includes('vendor_applications')) {
        console.log('Creating vendor_applications table...')
        await pool.query(`
          CREATE TABLE vendor_applications (
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
    }

    if (!tableNames.includes('vendors')) {
        console.log('Creating vendors table...')
        // Check if we need more columns in vendors
        await pool.query(`
          CREATE TABLE vendors (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) NOT NULL UNIQUE,
            phone VARCHAR(30),
            company VARCHAR(100),
            password VARCHAR(255) NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `)
    }
    
    console.log('Tables check complete.')
  } catch (e) {
    console.error('Error:', e)
  } finally {
    await pool.end()
  }
}

checkTables()
