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
  console.log('🔧 Implementing persistent strike tracking schema...')

  try {
    // 1. Update reported_bids
    console.log('Updating reported_bids table...')
    const [bCols] = await pool.query("SHOW COLUMNS FROM reported_bids LIKE 'vendor_user_id'")
    if (bCols.length === 0) {
      await pool.query('ALTER TABLE reported_bids ADD COLUMN vendor_user_id INT')
      console.log('✅ Added vendor_user_id to reported_bids.')
      
      // Backfill vendor_user_id from bids table where possible
      await pool.query(`
        UPDATE reported_bids rb
        JOIN bids b ON rb.bid_id = b.id
        SET rb.vendor_user_id = b.vendor_id
        WHERE rb.vendor_user_id IS NULL
      `)
      console.log('✅ Backfilled existing bid reports.')
    } else {
      console.log('✓ vendor_user_id already exists.')
    }

    // 2. Update reported_complaints
    console.log('Updating reported_complaints table...')
    const [cCols] = await pool.query("SHOW COLUMNS FROM reported_complaints LIKE 'citizen_user_id'")
    if (cCols.length === 0) {
      await pool.query('ALTER TABLE reported_complaints ADD COLUMN citizen_user_id INT')
      console.log('✅ Added citizen_user_id to reported_complaints.')
      
      // Backfill citizen_user_id from complaints table where possible
      await pool.query(`
        UPDATE reported_complaints rc
        JOIN complaints c ON rc.complaint_id = c.id
        SET rc.citizen_user_id = c.user_id
        WHERE rc.citizen_user_id IS NULL
      `)
      console.log('✅ Backfilled existing complaint reports.')
    } else {
      console.log('✓ citizen_user_id already exists.')
    }

  } catch (err) {
    console.error('❌ Migration failed:', err)
  } finally {
    await pool.end()
    process.exit(0)
  }
}

run()
