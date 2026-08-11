import { pool } from './db.js';
async function update() {
  try {
    await pool.query("ALTER TABLE bids MODIFY status ENUM('pending','accepted','rejected','warned','warned_acknowledged') DEFAULT 'pending'");
    console.log('Enum updated successfully');
  } catch(e) {
    console.error(e);
  } finally {
    process.exit();
  }
}
update();
