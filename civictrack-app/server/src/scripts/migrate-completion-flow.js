/**
 * Migration: Add columns needed for the end-to-end completion flow.
 * 
 * Run with:  node --experimental-modules src/scripts/migrate-completion-flow.js
 * 
 * Safe to re-run: uses IF NOT EXISTS / checks before adding columns.
 */
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

async function columnExists(table, column) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [process.env.DB_NAME || 'civictrack', table, column]
  )
  return rows[0].cnt > 0
}

async function run() {
  console.log('🔧 Running completion-flow migration...\n')

  // --- tasks table ---
  const taskColumns = [
    { name: 'vendor_completed_at', sql: 'ALTER TABLE tasks ADD COLUMN vendor_completed_at DATETIME NULL DEFAULT NULL' },
    { name: 'ministry_approved_at', sql: 'ALTER TABLE tasks ADD COLUMN ministry_approved_at DATETIME NULL DEFAULT NULL' },
    { name: 'progress_photos', sql: 'ALTER TABLE tasks ADD COLUMN progress_photos TEXT NULL DEFAULT NULL' },
    { name: 'completion_photo_url', sql: 'ALTER TABLE tasks ADD COLUMN completion_photo_url VARCHAR(500) NULL DEFAULT NULL' },
    { name: 'user_confirmed_at', sql: 'ALTER TABLE tasks ADD COLUMN user_confirmed_at DATETIME NULL DEFAULT NULL' },
  ]
  for (const col of taskColumns) {
    if (await columnExists('tasks', col.name)) {
      console.log(`  ✓ tasks.${col.name} already exists`)
    } else {
      await pool.query(col.sql)
      console.log(`  + Added tasks.${col.name}`)
    }
  }

  // --- complaints table ---
  if (await columnExists('complaints', 'confirmed_at')) {
    console.log('  ✓ complaints.confirmed_at already exists')
  } else {
    await pool.query('ALTER TABLE complaints ADD COLUMN confirmed_at DATETIME NULL DEFAULT NULL')
    console.log('  + Added complaints.confirmed_at')
  }

  // --- reported_bids table ---
  if (await columnExists('reported_bids', 'action_taken')) {
    console.log('  ✓ reported_bids.action_taken already exists')
  } else {
    await pool.query("ALTER TABLE reported_bids ADD COLUMN action_taken VARCHAR(50) NULL DEFAULT NULL")
    console.log('  + Added reported_bids.action_taken')
  }

  // --- users table: soft delete ---
  if (await columnExists('users', 'deleted_at')) {
    console.log('  ✓ users.deleted_at already exists')
  } else {
    await pool.query('ALTER TABLE users ADD COLUMN deleted_at DATETIME NULL DEFAULT NULL')
    console.log('  + Added users.deleted_at')
  }

  // --- Ensure complaints.status can hold 'Archived' and 'Vendor Complete' ---
  // MySQL ENUM modification: we read current enum values and add missing ones
  try {
    const [cols] = await pool.query(
      `SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'complaints' AND COLUMN_NAME = 'status'`,
      [process.env.DB_NAME || 'civictrack']
    )
    const colType = cols[0]?.COLUMN_TYPE || ''
    if (colType.startsWith('enum')) {
      const needsArchived = !colType.includes("'Archived'")
      const needsVendorComplete = !colType.includes("'Vendor Complete'")
      if (needsArchived || needsVendorComplete) {
        // Parse existing values
        const match = colType.match(/enum\((.+)\)/i)
        if (match) {
          let values = match[1] // e.g. 'Pending','In Progress','Complete',...
          if (needsArchived) values += ",'Archived'"
          if (needsVendorComplete) values += ",'Vendor Complete'"
          await pool.query(`ALTER TABLE complaints MODIFY COLUMN status enum(${values}) DEFAULT 'Pending'`)
          console.log(`  + Updated complaints.status enum (added ${[needsArchived && 'Archived', needsVendorComplete && 'Vendor Complete'].filter(Boolean).join(', ')})`)
        }
      } else {
        console.log('  ✓ complaints.status enum already has Archived and Vendor Complete')
      }
    } else {
      console.log('  ⚠ complaints.status is not an ENUM type (VARCHAR), Archived/Vendor Complete will work as-is')
    }
  } catch (e) {
    console.log('  ⚠ Could not check/modify complaints.status enum:', e.message)
  }

  console.log('\n✅ Migration complete!')
  await pool.end()
  process.exit(0)
}

run().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})
