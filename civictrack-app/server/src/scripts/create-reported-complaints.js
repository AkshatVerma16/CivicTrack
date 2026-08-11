import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const envPath = path.join(__dirname, '..', '..', '.env')
const cwdEnvPath = path.resolve(process.cwd(), '.env')
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath })
} else if (fs.existsSync(cwdEnvPath)) {
  dotenv.config({ path: cwdEnvPath })
} else {
  dotenv.config()
}

import mysql from 'mysql2/promise'

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'civictrack',
  waitForConnections: true,
  connectionLimit: 2,
})

async function run() {
  console.log('🔧 Running reported complaints migration...\n')

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reported_complaints (
        id INT NOT NULL AUTO_INCREMENT,
        complaint_id BIGINT UNSIGNED NOT NULL,
        ministry_id INT UNSIGNED NOT NULL,
        reason TEXT,
        action_taken VARCHAR(50) DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
        FOREIGN KEY (ministry_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('  + Created reported_complaints table (if not exists)');

    const [cols] = await pool.query(
      `SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'complaints' AND COLUMN_NAME = 'status'`,
      [process.env.DB_NAME || 'civictrack']
    )
    const colType = cols[0]?.COLUMN_TYPE || ''
    if (colType.startsWith('enum')) {
      const match = colType.match(/enum\((.+)\)/i)
      if (match) {
        let values = match[1] // e.g. 'Pending','In Progress',...
        let needsUpdate = false;
        
        if (!colType.includes("'Reported'")) { values += ",'Reported'"; needsUpdate = true; }
        if (!colType.includes("'Warned'")) { values += ",'Warned'"; needsUpdate = true; }
        if (!colType.includes("'Warned (Acknowledged)'")) { values += ",'Warned (Acknowledged)'"; needsUpdate = true; }

        if (needsUpdate) {
            await pool.query(`ALTER TABLE complaints MODIFY COLUMN status enum(${values}) DEFAULT 'Pending'`)
            console.log(`  + Updated complaints.status enum to include new statuses.`);
        } else {
            console.log(`  ✓ complaints.status enum already has new statuses.`);
        }
      }
    }
  } catch (err) {
    console.error('Migration error:', err)
  }

  console.log('\n✅ Migration complete!')
  await pool.end()
  process.exit(0)
}

run().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})
