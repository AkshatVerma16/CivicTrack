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
    // Test the exact query the vendor apply route uses
    const email = 'test@test.com'
    console.log('Testing UNION query...')
    const [existing] = await pool.query(
      'SELECT id FROM vendor_applications WHERE email = ? UNION SELECT id FROM users WHERE email = ?',
      [email, email]
    )
    console.log('UNION query result:', existing)

    // Describe vendor_applications
    const [desc] = await pool.query('DESCRIBE vendor_applications')
    console.log('vendor_applications columns:')
    desc.forEach(col => console.log(`  ${col.Field} - ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`))

  } catch (e) {
    console.error('ERROR:', e.message)
    console.error('Full error:', e)
  } finally {
    await pool.end()
  }
}

main()
