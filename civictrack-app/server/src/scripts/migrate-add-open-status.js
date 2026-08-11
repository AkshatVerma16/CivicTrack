import mysql from 'mysql2/promise'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') })

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'civictrack',
  waitForConnections: true,
  connectionLimit: 1,
})

async function run() {
  console.log('🔧 Updating complaints status enum to include Open status...')

  try {
    const dbName = process.env.DB_NAME || 'civictrack'
    const [cols] = await pool.query(
      `SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'complaints' AND COLUMN_NAME = 'status'`,
      [dbName]
    )
    
    if (cols.length === 0) {
      console.log('❌ Could not find complaints table or status column.')
      process.exit(1)
    }

    const colType = cols[0].COLUMN_TYPE 
    console.log('Current status column type:', colType)

    if (colType.startsWith('enum')) {
      const match = colType.match(/enum\((.+)\)/i)
      if (match) {
        let valuesStr = match[1] 
        let values = valuesStr.split(',').map(v => v.replace(/'/g, ''))
        
        if (!values.includes('Open')) {
          values.push('Open')
          const newValuesStr = values.map(v => `'${v}'`).join(',')
          const sql = `ALTER TABLE complaints MODIFY COLUMN status enum(${newValuesStr}) DEFAULT 'Pending'`
          await pool.query(sql)
          console.log('✅ Successfully added Open to status enum.')
        } else {
          console.log('✓ Open status already exists in enum.')
        }
      }
    } else {
      console.log('✓ Status column is not an enum, skipping modification.')
    }
  } catch (err) {
    console.error('❌ Migration failed:', err)
  } finally {
    await pool.end()
    process.exit(0)
  }
}

run()
