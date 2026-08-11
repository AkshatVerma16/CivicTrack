import { Router } from 'express';
import { runQuery } from '../db.js';
import { requireAuth, requireAdmin, requireMinistryOrAdmin } from '../middleware/auth.js';

const router = Router();

// POST /api/bids - Vendor places a bid
router.post('/', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'vendor') return res.status(403).json({ error: 'Only vendors can bid' });
    const { complaint_id, estimated_time, budget } = req.body;
    if (!complaint_id || !estimated_time || !budget) return res.status(400).json({ error: 'Missing fields' });
    // Only allow one active bid per vendor per complaint
    const existing = await runQuery('SELECT * FROM bids WHERE complaint_id = ? AND vendor_id = ?', [complaint_id, req.user.id]);
    if (existing.length > 0) return res.status(400).json({ error: 'You have already placed an active bid for this complaint' });

    // Check if repeat bidder via audit logs
    const auditLogs = await runQuery('SELECT id FROM bid_audit_logs WHERE complaint_id = ? AND vendor_id = ?', [complaint_id, req.user.id]);
    const is_repetition = auditLogs.length > 0 ? 1 : 0;

    await runQuery(
      'INSERT INTO bids (complaint_id, vendor_id, estimated_time, budget, is_repetition) VALUES (?, ?, ?, ?, ?)', 
      [complaint_id, req.user.id, estimated_time, budget, is_repetition]
    );
    res.status(201).json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/bids/:complaint_id - List all bids for a complaint
router.get('/:complaint_id(\\d+)', requireAuth, async (req, res) => {
  try {
    const { complaint_id } = req.params;
    const bids = await runQuery(`
      SELECT b.*, u.name as vendor_name, u.email as vendor_email,
             b.is_repetition as is_rebid
      FROM bids b
      JOIN users u ON b.vendor_id = u.id
      WHERE b.complaint_id = ?
      ORDER BY b.budget ASC, b.estimated_time ASC
    `, [complaint_id]);
    res.json(bids);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/bids/:bid_id/approve - Approve a bid (Ministry or Admin)
router.post('/:bid_id/approve', requireMinistryOrAdmin, async (req, res) => {
  try {
    const { bid_id } = req.params;
    // Get bid and complaint
    const [bid] = await runQuery('SELECT * FROM bids WHERE id = ?', [bid_id]);
    if (!bid) return res.status(404).json({ error: 'Bid not found' });
    // Only allow ministry of the complaint to approve (admin can approve any)
    const [complaint] = await runQuery('SELECT * FROM complaints WHERE id = ?', [bid.complaint_id]);
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
    if (req.user.role === 'ministry' && complaint.ministry_id !== req.user.department_id) {
      return res.status(403).json({ error: 'Not authorized for this complaint' });
    }

    // Approve this bid, reject others
    await runQuery('UPDATE bids SET status = CASE WHEN id = ? THEN "accepted" ELSE "rejected" END WHERE complaint_id = ?', [bid_id, bid.complaint_id]);

    // Ensure vendor record exists in vendors table (needed for tasks FK)
    const existingVendor = await runQuery('SELECT id FROM vendors WHERE user_id = ? AND ministry_id = ?', [bid.vendor_id, complaint.ministry_id]);
    let vendorTableId;
    if (existingVendor.length > 0) {
      vendorTableId = existingVendor[0].id;
    } else {
      const result = await runQuery('INSERT INTO vendors (user_id, ministry_id) VALUES (?, ?)', [bid.vendor_id, complaint.ministry_id]);
      vendorTableId = result.insertId;
    }

    // Create a task entry
    await runQuery(
      `INSERT INTO tasks (complaint_id, vendor_id, completion_percentage, status_updates) VALUES (?, ?, 0, ?)`,
      [bid.complaint_id, vendorTableId, `Bid approved - Budget: ₹${bid.budget}, Timeline: ${bid.estimated_time} days`]
    );

    // Update complaint status to 'In Progress'
    await runQuery('UPDATE complaints SET status = "In Progress" WHERE id = ?', [bid.complaint_id]);

    res.json({ success: true, message: 'Bid approved and task created' });
  } catch (e) {
    console.error('Approve bid error:', e);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/bids/:bid_id/report - Report a bid to admin (Ministry or Admin)
router.post('/:bid_id/report', requireMinistryOrAdmin, async (req, res) => {
  try {
    const { bid_id } = req.params;
    const { reason } = req.body;
    // Check bid exists
    const [bid] = await runQuery('SELECT * FROM bids WHERE id = ?', [bid_id]);
    if (!bid) return res.status(404).json({ error: 'Bid not found' });
    // Only allow ministry of the complaint to report (admin can report any)
    const [complaint] = await runQuery('SELECT * FROM complaints WHERE id = ?', [bid.complaint_id]);
    if (req.user.role === 'ministry' && (!complaint || complaint.ministry_id !== req.user.department_id)) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    await runQuery('UPDATE bids SET status = "reported" WHERE id = ?', [bid_id]);
    await runQuery('INSERT INTO reported_bids (bid_id, ministry_id, vendor_user_id, reason) VALUES (?, ?, ?, ?)', [bid_id, req.user.id, bid.vendor_id, reason || null]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/bids/ministry/reported - Ministry: View their reported bids
router.get('/ministry/reported', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'ministry') return res.status(403).json({ error: 'Access denied' });
    const rows = await runQuery(`
      SELECT rb.*, b.budget, b.estimated_time, b.status as bid_status, c.title as complaint_title, u.name as vendor_name
      FROM reported_bids rb
      JOIN bids b ON rb.bid_id = b.id
      JOIN complaints c ON b.complaint_id = c.id
      JOIN users u ON b.vendor_id = u.id
      WHERE rb.ministry_id = ?
      ORDER BY rb.created_at DESC
    `, [req.user.id]);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/bids/reported/all - Admin: View all reported bids/vendors
router.get('/reported/all', requireAdmin, async (req, res) => {
  try {
    const rows = await runQuery(`
      SELECT rb.*, b.complaint_id, b.vendor_id, b.estimated_time, b.budget, b.status as bid_status,
             u.name as vendor_name, u.email as vendor_email, u.warning_count,
             c.title as complaint_title,
             (SELECT COUNT(*) 
              FROM reported_bids rb2 
              WHERE rb2.vendor_user_id = b.vendor_id) as total_reports
      FROM reported_bids rb
      LEFT JOIN bids b ON rb.bid_id = b.id
      LEFT JOIN users u ON b.vendor_id = u.id
      LEFT JOIN complaints c ON b.complaint_id = c.id
      WHERE rb.action_taken IS NULL
      ORDER BY rb.created_at DESC
    `);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/bids/:bid_id/warning - Admin: issue warning
router.delete('/:bid_id/warning', requireAdmin, async (req, res) => {
  try {
    const { bid_id } = req.params;
    
    // Get vendor info first
    const [bid] = await runQuery('SELECT b.vendor_id, u.warning_count FROM bids b JOIN users u ON b.vendor_id = u.id WHERE b.id = ?', [bid_id]);
    if (!bid) return res.status(404).json({ error: 'Bid not found' });
    if (bid.warning_count > 0) return res.status(400).json({ error: 'User already has a warning. Final action (Delete) required.' });

    // Increment warning count
    await runQuery('UPDATE users SET warning_count = warning_count + 1 WHERE id = ?', [bid.vendor_id]);

    // Mark bid as warned
    await runQuery('UPDATE bids SET status = "warned" WHERE id = ?', [bid_id]);
    // Mark the reported_bids entry with action taken
    await runQuery('UPDATE reported_bids SET action_taken = "warned" WHERE bid_id = ? AND action_taken IS NULL', [bid_id]);
    res.json({ success: true, message: 'Warning issued and bid marked as warned' });
  } catch (e) {
    console.error('Warning update error:', e);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/bids/:id/acknowledge-warning - Vendor: acknowledge warning
router.post('/:id/acknowledge-warning', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'vendor') return res.status(403).json({ error: 'Only vendors can acknowledge warnings' });
    const { id } = req.params;
    // Ensure the bid belongs to the vendor
    const [bid] = await runQuery('SELECT * FROM bids WHERE id = ? AND vendor_id = ?', [id, req.user.id]);
    if (!bid) return res.status(404).json({ error: 'Bid not found' });
    if (bid.status !== 'warned') return res.status(400).json({ error: 'Bid is not in warned state' });

    // Fetch the report reason
    const [report] = await runQuery('SELECT reason, ministry_id FROM reported_bids WHERE bid_id = ? ORDER BY created_at DESC LIMIT 1', [id]);
    const reason = report ? report.reason : null;
    const ministry_id = report ? report.ministry_id : null;

    // Archive bid
    await runQuery(`
      INSERT INTO bid_audit_logs (original_bid_id, complaint_id, vendor_id, ministry_id, budget, estimated_time, reason, action) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [bid.id, bid.complaint_id, bid.vendor_id, ministry_id, bid.budget, bid.estimated_time, reason, 'Acknowledged Warning']);

    // Delete bid
    await runQuery('DELETE FROM bids WHERE id = ?', [id]);
    
    res.json({ success: true, message: 'Warning acknowledged and bid archived' });
  } catch (e) {
    console.error('Acknowledge warning error:', e);
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/bids/vendor/:vendor_id - Admin: Delete vendor but preserve completed task history
router.delete('/vendor/:vendor_id', requireAdmin, async (req, res) => {
  try {
    const { vendor_id } = req.params;

    // Mark reported bids for this vendor's bids with action taken
    await runQuery(`UPDATE reported_bids SET action_taken = 'vendor_deleted' WHERE bid_id IN (SELECT id FROM bids WHERE vendor_id = ?) AND action_taken IS NULL`, [vendor_id]);

    // Delete reported bids for this vendor's bids
    await runQuery(`DELETE FROM reported_bids WHERE bid_id IN (SELECT id FROM bids WHERE vendor_id = ?)`, [vendor_id]);

    // Delete bids by this vendor
    await runQuery('DELETE FROM bids WHERE vendor_id = ?', [vendor_id]);

    // For tasks: preserve completed ones (set vendor_id = NULL), delete incomplete ones
    const vendorRecords = await runQuery('SELECT id FROM vendors WHERE user_id = ?', [vendor_id]);
    for (const v of vendorRecords) {
      // Preserve completed tasks by nullifying vendor_id
      await runQuery('UPDATE tasks SET vendor_id = NULL, status_updates = CONCAT(COALESCE(status_updates, ""), "\n[Vendor Deleted]") WHERE vendor_id = ? AND completion_percentage = 100', [v.id]);
      // Delete incomplete tasks
      await runQuery('DELETE FROM tasks WHERE vendor_id = ? AND completion_percentage < 100', [v.id]);
    }

    // Delete vendor records
    await runQuery('DELETE FROM vendors WHERE user_id = ?', [vendor_id]);

    // Delete notifications and activity logs
    await runQuery('DELETE FROM notifications WHERE user_id = ?', [vendor_id]);
    await runQuery('DELETE FROM activity_logs WHERE user_id = ?', [vendor_id]);

    // Hard-delete vendor user
    await runQuery('DELETE FROM users WHERE id = ? AND role = "vendor"', [vendor_id]);
    res.json({ success: true });
  } catch (e) {
    console.error('Delete vendor error:', e);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/bids/open/complaints - Vendor: list open complaints available for bidding
router.get('/open/complaints', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'vendor') return res.status(403).json({ error: 'Only vendors can view open complaints' });
    const rows = await runQuery(`
      SELECT c.id, c.title, c.description, c.status, c.latitude, c.longitude, c.image_url, c.created_at,
             m.name as ministry_name,
             (SELECT COUNT(*) FROM bids WHERE complaint_id = c.id AND vendor_id = ? AND status IN ('pending', 'accepted', 'reported', 'warned')) as my_bids
      FROM complaints c
      JOIN ministries m ON c.ministry_id = m.id
      LEFT JOIN tasks t ON t.complaint_id = c.id
      WHERE c.status = 'Open'
      ORDER BY c.created_at DESC
    `, [req.user.id]);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/bids/my/all - Vendor: list my bids
router.get('/my/all', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'vendor') return res.status(403).json({ error: 'Only vendors can view their bids' });
    const rows = await runQuery(`
      SELECT b.*, c.title as complaint_title, c.description as complaint_description, c.status as complaint_status, m.name as ministry_name
      FROM bids b
      JOIN complaints c ON b.complaint_id = c.id
      JOIN ministries m ON c.ministry_id = m.id
      WHERE b.vendor_id = ?
      ORDER BY b.created_at DESC
    `, [req.user.id]);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/bids/my/audit-logs - Vendor: list their archived bids
router.get('/my/audit-logs', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'vendor') return res.status(403).json({ error: 'Only vendors can view their audit logs' });
    const rows = await runQuery(`
      SELECT a.*, c.title as complaint_title, m.name as ministry_name
      FROM bid_audit_logs a
      JOIN complaints c ON a.complaint_id = c.id
      LEFT JOIN ministries m ON a.ministry_id = m.id
      WHERE a.vendor_id = ?
      ORDER BY a.created_at DESC
    `, [req.user.id]);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
