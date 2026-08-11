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
    const [rows] = await pool.query(`
      SELECT c.id, c.title, c.description, c.status, c.latitude, c.longitude, c.image_url, c.created_at,
             m.name as ministry_name
      FROM complaints c
      JOIN ministries m ON c.ministry_id = m.id
      LEFT JOIN tasks t ON t.complaint_id = c.id
      WHERE (c.status IN ('Pending', 'Open') OR t.id IS NULL)
        AND c.status NOT IN ('Complete', 'Resolved', 'Withdrawn', 'In Progress')
      ORDER BY c.created_at DESC
    `)
    console.log('Open complaints found:', rows.length)
    rows.forEach(r => {
      console.log(`  #${r.id} | ${r.title} | status=${r.status} | ministry=${r.ministry_name} | image=${r.image_url}`)
    })
  } catch (e) {
    console.error('Query error:', e.message)
  } finally {
    await pool.end()
  }
}

main()
