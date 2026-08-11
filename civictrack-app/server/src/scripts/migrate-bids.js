import { runQuery } from '../db.js';

async function migrate() {
  try {
    console.log("Adding is_repetition to bids...");
    try {
      await runQuery("ALTER TABLE bids ADD COLUMN is_repetition BOOLEAN DEFAULT FALSE;");
    } catch (e) {
      if (e.code !== 'ER_DUP_FIELDNAME') console.error("Error adding is_repetition:", e.message);
    }
    
    console.log("Modifying bids status enum...");
    try {
      await runQuery("ALTER TABLE bids MODIFY COLUMN status ENUM('pending', 'accepted', 'rejected', 'reported', 'warned', 'warned_acknowledged') NOT NULL DEFAULT 'pending';");
    } catch (e) {
      console.error("Error updating enum:", e.message);
    }

    console.log("Creating bid_audit_logs table...");
    await runQuery(`
      CREATE TABLE IF NOT EXISTS bid_audit_logs (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        original_bid_id BIGINT UNSIGNED NOT NULL,
        complaint_id BIGINT UNSIGNED NOT NULL,
        vendor_id INT UNSIGNED NOT NULL,
        ministry_id INT UNSIGNED NULL,
        budget DECIMAL(12,2) NOT NULL,
        estimated_time INT UNSIGNED NOT NULL,
        reason TEXT,
        action VARCHAR(100) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_bid_audit_logs_complaint_id (complaint_id),
        KEY idx_bid_audit_logs_vendor_id (vendor_id),
        CONSTRAINT fk_bid_audit_logs_complaint_id FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
        CONSTRAINT fk_bid_audit_logs_vendor_id FOREIGN KEY (vendor_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log("Migration complete.");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrate();
