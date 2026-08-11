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
    // Add progress_photos column to tasks
    console.log('Adding progress_photos column...')
    try {
      await pool.query('ALTER TABLE tasks ADD COLUMN progress_photos TEXT DEFAULT NULL')
      console.log('  ✓ progress_photos added')
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') console.log('  - progress_photos already exists')
      else throw e
    }

    // Add completion_photo_url column to tasks
    console.log('Adding completion_photo_url column...')
    try {
      await pool.query('ALTER TABLE tasks ADD COLUMN completion_photo_url VARCHAR(255) DEFAULT NULL')
      console.log('  ✓ completion_photo_url added')
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') console.log('  - completion_photo_url already exists')
      else throw e
    }

    // Add vendor_completed_at column to tasks
    console.log('Adding vendor_completed_at column...')
    try {
      await pool.query('ALTER TABLE tasks ADD COLUMN vendor_completed_at DATETIME DEFAULT NULL')
      console.log('  ✓ vendor_completed_at added')
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') console.log('  - vendor_completed_at already exists')
      else throw e
    }

    // Add ministry_approved_at column to tasks
    console.log('Adding ministry_approved_at column...')
    try {
      await pool.query('ALTER TABLE tasks ADD COLUMN ministry_approved_at DATETIME DEFAULT NULL')
      console.log('  ✓ ministry_approved_at added')
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') console.log('  - ministry_approved_at already exists')
      else throw e
    }

    // Make tasks.vendor_id nullable (for preserving history when vendor is deleted)
    console.log('Making tasks.vendor_id nullable...')
    try {
      // Get current column type first
      const [cols] = await pool.query("SHOW COLUMNS FROM tasks WHERE Field = 'vendor_id'")
      if (cols.length > 0) {
        const colType = cols[0].Type
        const isNullable = cols[0].Null === 'YES'
        if (!isNullable) {
          await pool.query(`ALTER TABLE tasks MODIFY COLUMN vendor_id ${colType} DEFAULT NULL`)
          console.log('  ✓ vendor_id is now nullable')
        } else {
          console.log('  - vendor_id is already nullable')
        }
      }
    } catch (e) {
      console.log('  ! Could not modify vendor_id:', e.message)
    }

    console.log('\n✅ Migration complete!')

  } catch (e) {
    console.error('Migration error:', e.message)
  } finally {
    await pool.end()
  }
}

main()
