import { Router } from 'express'
import fs from 'fs'
import path from 'path'
import { runQuery } from '../db.js'
import { upload } from '../middleware/upload.js'
import { requireAdmin, requireAuth } from '../middleware/auth.js'

const router = Router()

// POST /api/complaints - submit complaint with optional photo
router.post('/', requireAuth, upload.single('photo'), async (req, res) => {
  try {
    const { ministry_id, title, description, latitude, longitude } = req.body
    const user_id = req.user.id
    if (!ministry_id) return res.status(400).json({ error: 'ministry_id is required' })
    if (!title || !description) return res.status(400).json({ error: 'title and description are required' })
    if (!req.file && String(description).trim().length === 0) {
      return res.status(400).json({ error: 'description or photo is required' })
    }
    const image_url = req.file ? `/${process.env.UPLOAD_DIR || 'uploads'}/${req.file.filename}` : null
    const result = await runQuery(
      `INSERT INTO complaints (user_id, ministry_id, title, description, image_url, latitude, longitude, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')`,
      [user_id, ministry_id, title, description, image_url, latitude || null, longitude || null]
    )
    const [created] = await runQuery('SELECT * FROM complaints WHERE id = ?', [result.insertId])
    res.status(201).json(created)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// GET /api/complaints/user - list complaints for the authenticated user
router.get('/user', requireAuth, async (req, res) => {
  try {
    const rows = await runQuery(`
      SELECT c.*, m.name AS ministry_name, t.completion_photo_url, t.progress_photos
      FROM complaints c
      LEFT JOIN ministries m ON c.ministry_id = m.id
      LEFT JOIN tasks t ON t.complaint_id = c.id
      WHERE c.user_id = ?
      ORDER BY c.created_at DESC
    `, [req.user.id])
    res.json(rows)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// GET /api/complaints/user/:id - list complaints for a user by ID
router.get('/user/:id', async (req, res) => {
  try {
    const rows = await runQuery(`
      SELECT c.*, m.name AS ministry_name
      FROM complaints c
      LEFT JOIN ministries m ON c.ministry_id = m.id
      WHERE c.user_id = ?
      ORDER BY c.created_at DESC
    `, [req.params.id])
    res.json(rows)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// POST /api/complaints/:id/withdraw - authenticated user withdraws their own complaint
router.post('/:id/withdraw', requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id
    const rows = await runQuery('SELECT * FROM complaints WHERE id = ? AND user_id = ?', [id, userId])
    const complaint = rows[0]
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' })
    }
    if (['Complete', 'Resolved', 'Withdrawn'].includes(complaint.status)) {
      return res.status(400).json({ error: 'Cannot withdraw a completed or already withdrawn complaint' })
    }
    await runQuery('UPDATE complaints SET status = ? WHERE id = ?', ['Withdrawn', id])
    const [updated] = await runQuery('SELECT * FROM complaints WHERE id = ?', [id])
    res.json(updated)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// POST /api/complaints/:id/confirm - authenticated user confirms their complaint is resolved → Archived
router.post('/:id/confirm', requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id
    const rows = await runQuery('SELECT * FROM complaints WHERE id = ? AND user_id = ?', [id, userId])
    const complaint = rows[0]
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' })
    }
    if (!['Complete', 'Resolved', 'Vendor Complete'].includes(complaint.status)) {
      return res.status(400).json({ error: 'Complaint must be Complete or Resolved to confirm' })
    }

    // Archive the complaint
    await runQuery('UPDATE complaints SET status = "Archived", confirmed_at = NOW() WHERE id = ?', [id])

    // Mark the associated task as user-confirmed
    await runQuery('UPDATE tasks SET user_confirmed_at = NOW() WHERE complaint_id = ?', [id])

    // Notify the ministry
    const ministryUsers = await runQuery('SELECT id FROM users WHERE role = "ministry" AND ministry_id = ?', [complaint.ministry_id])
    for (const mu of ministryUsers) {
      await runQuery(
        'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
        [mu.id, `User has confirmed and archived complaint "${complaint.title}". The task is now complete.`]
      )
    }

    // Notify the vendor (find via task → vendor → user)
    const taskRows = await runQuery(`
      SELECT v.user_id as vendor_user_id FROM tasks t
      JOIN vendors v ON t.vendor_id = v.id
      WHERE t.complaint_id = ?
    `, [id])
    for (const t of taskRows) {
      if (t.vendor_user_id) {
        await runQuery(
          'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
          [t.vendor_user_id, `Your completed work on "${complaint.title}" has been confirmed by the citizen. Task archived.`]
        )
      }
    }

    const [updated] = await runQuery('SELECT * FROM complaints WHERE id = ?', [id])
    res.json(updated)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})


// GET /api/ministry/complaints - get complaints for ministry user's ministry
router.get('/ministry/complaints', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'ministry') {
      return res.status(403).json({ error: 'Access denied' })
    }
    const departmentId = req.user.department_id
    if (!departmentId) {
      return res.status(400).json({ error: 'No department assigned to user' })
    }
    const { status } = req.query
    const where = ['c.ministry_id = ?']
    const params = [departmentId]
    if (status) {
      where.push('c.status = ?')
      params.push(status)
    } else {
      where.push(`c.status != 'Withdrawn'`)
    }
    const whereSql = `WHERE ${where.join(' AND ')}`
    const rows = await runQuery(`
      SELECT c.*, c.latitude AS latitude, c.longitude AS longitude, u.name as reporter_name, m.name as ministry_name
      FROM complaints c
      JOIN users u ON c.user_id = u.id
      JOIN ministries m ON c.ministry_id = m.id
      ${whereSql}
      ORDER BY c.created_at DESC
    `, params)
    res.json(rows)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})
router.get('/ministry/vendors', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'ministry') {
      return res.status(403).json({ error: 'Access denied' })
    }
    const departmentId = req.user.department_id
    if (!departmentId) {
      return res.status(400).json({ error: 'No department assigned to user' })
    }
    const rows = await runQuery(`
      SELECT u.id, u.name, u.email 
      FROM users u 
      JOIN vendors v ON u.id = v.user_id 
      WHERE u.role = 'vendor' AND v.ministry_id = ?
      ORDER BY u.name
    `, [departmentId])
    res.json(rows)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// POST /api/ministry/assign-vendor - assign complaint to vendor (ministry only)
router.post('/ministry/assign-vendor', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'ministry') {
      return res.status(403).json({ error: 'Access denied' })
    }
    const { complaint_id, vendor_id } = req.body
    if (!complaint_id || !vendor_id) {
      return res.status(400).json({ error: 'complaint_id and vendor_id are required' })
    }

    // Verify the complaint exists and belongs to user's ministry
    const complaintRows = await runQuery('SELECT * FROM complaints WHERE id = ? AND ministry_id = ?', [complaint_id, req.user.department_id])
    const complaint = complaintRows[0]
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found or not in your ministry' })
    }

    // Verify vendor exists and belongs to the same ministry
    const vendorRows = await runQuery(`
      SELECT v.* FROM vendors v 
      JOIN users u ON v.user_id = u.id 
      WHERE v.id = ? AND v.ministry_id = ? AND u.role = 'vendor'
    `, [vendor_id, req.user.department_id])
    if (vendorRows.length === 0) {
      return res.status(400).json({ error: 'Invalid vendor for your ministry' })
    }

    // Create task
    const result = await runQuery(
      `INSERT INTO tasks (complaint_id, vendor_id, completion_percentage, status_updates)
       VALUES (?, ?, 0, 'Assigned to vendor')`,
      [complaint_id, vendor_id]
    )

    // Update complaint status
    await runQuery('UPDATE complaints SET status = ? WHERE id = ?', ['In Progress', complaint_id])

    const [created] = await runQuery('SELECT * FROM tasks WHERE id = ?', [result.insertId])
    res.status(201).json(created)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// GET /api/complaints/active - get active complaints with coordinates
router.get('/active', async (req, res) => {
  try {
    const rows = await runQuery(`
      SELECT c.id, c.title, c.description, c.image_url, c.status, c.latitude, c.longitude, m.name as department
      FROM complaints c
      JOIN ministries m ON c.ministry_id = m.id
      WHERE c.status IN ('Pending', 'In Progress') AND c.latitude IS NOT NULL AND c.longitude IS NOT NULL
      ORDER BY c.created_at DESC
    `)
    res.json(rows)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// GET /api/complaints - admin: get all complaints
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { status, ministry_id } = req.query
    const where = []
    const params = []
    if (status) { where.push('status = ?'); params.push(status) }
    else { where.push(`status != 'Withdrawn'`) }
    if (ministry_id) { where.push('ministry_id = ?'); params.push(ministry_id) }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
    const rows = await runQuery(`SELECT * FROM complaints ${whereSql} ORDER BY created_at DESC`, params)
    res.json(rows)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// PUT /api/complaints/:id - admin: update status and ministry
router.put('/:id', requireAdmin, async (req, res) => {
  const { status, ministry_id } = req.body
  const { id } = req.params
  try {
    const allowed = ['Pending','In Progress','Complete','Resolved','Withdrawn']
    if (status && !allowed.includes(status)) {
      return res.status(400).json({ error: 'invalid status' })
    }
    await runQuery('UPDATE complaints SET status = COALESCE(?, status), ministry_id = COALESCE(?, ministry_id) WHERE id = ?', [status ?? null, ministry_id ?? null, id])
    const [updated] = await runQuery('SELECT * FROM complaints WHERE id = ?', [id])
    res.json(updated)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// DELETE /api/complaints/:id - admin: reject and delete complaint
router.delete('/:id', requireAdmin, async (req, res) => {
  const { id } = req.params
  try {
    const rows = await runQuery('SELECT * FROM complaints WHERE id = ? LIMIT 1', [id])
    const complaint = rows[0]
    if (!complaint) {
      return res.status(404).json({ error: 'Not found' })
    }

    if (complaint.photo_url) {
      try {
        const uploadDir = process.env.UPLOAD_DIR || 'uploads'
        const filename = path.basename(String(complaint.photo_url))
        const fullPath = path.join(uploadDir, filename)
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath)
        }
      } catch (_) {
        // ignore file deletion errors
      }
    }

    await runQuery('DELETE FROM complaints WHERE id = ?', [id])
    res.status(204).send()
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// POST /api/complaints/:id/report - Ministry: Report fake complaint
router.post('/:id/report', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'ministry') return res.status(403).json({ error: 'Access denied' })
    const { id } = req.params
    const { reason } = req.body
    
    // Ensure complaint belongs to this ministry
    const [complaint] = await runQuery('SELECT * FROM complaints WHERE id = ? AND ministry_id = ?', [id, req.user.department_id])
    if (!complaint) return res.status(404).json({ error: 'Complaint not found or not in your ministry' })

    await runQuery('UPDATE complaints SET status = "Reported" WHERE id = ?', [id])
    await runQuery('INSERT INTO reported_complaints (complaint_id, ministry_id, reason, citizen_user_id) VALUES (?, ?, ?, ?)', [id, req.user.id, reason || null, complaint.user_id])
    res.json({ success: true, message: 'Complaint reported successfully' })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// POST /api/complaints/:id/approve-complaint - Ministry: Approve pending complaint to Open for bidding
router.post('/:id/approve-complaint', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'ministry') return res.status(403).json({ error: 'Access denied' })
    const { id } = req.params
    
    // Ensure complaint belongs to this ministry and is Pending
    const [complaint] = await runQuery('SELECT * FROM complaints WHERE id = ? AND ministry_id = ?', [id, req.user.department_id])
    if (!complaint) return res.status(404).json({ error: 'Complaint not found or not in your ministry' })
    if (complaint.status !== 'Pending') return res.status(400).json({ error: 'Only pending complaints can be approved' })

    await runQuery('UPDATE complaints SET status = "Open" WHERE id = ?', [id])
    
    // Notify the citizen
    await runQuery('INSERT INTO notifications (user_id, message) VALUES (?, ?)', [complaint.user_id, `Your complaint "${complaint.title}" has been approved by the ministry and is now open for bidding.`])

    res.json({ success: true, message: 'Complaint approved and opened for bidding' })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// GET /api/complaints/reported/all - Admin: View all reported complaints
router.get('/reported/all', requireAdmin, async (req, res) => {
  try {
    const rows = await runQuery(`
      SELECT rc.*, c.title as complaint_title, c.description, c.status as complaint_status,
             u.id as reporter_user_id, u.name as reporter_name, u.email as reporter_email, u.warning_count,
             m.name as ministry_name
      FROM reported_complaints rc
      LEFT JOIN complaints c ON rc.complaint_id = c.id
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN users mu ON rc.ministry_id = mu.id
      LEFT JOIN ministries m ON mu.ministry_id = m.id
      WHERE rc.action_taken IS NULL
      ORDER BY rc.created_at DESC
    `)
    res.json(rows)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// DELETE /api/complaints/:id/warning - Admin: Warn the user for fake complaint
router.delete('/:id/warning', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    
    // Get user info first
    const [complaint] = await runQuery('SELECT c.user_id, c.title, u.warning_count FROM complaints c JOIN users u ON c.user_id = u.id WHERE c.id = ?', [id])
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' })
    if (complaint.warning_count > 0) return res.status(400).json({ error: 'User already has a warning. Final action (Delete) required.' })

    // Increment warning count
    await runQuery('UPDATE users SET warning_count = warning_count + 1 WHERE id = ?', [complaint.user_id])

    await runQuery('UPDATE complaints SET status = "Warned" WHERE id = ?', [id])
    await runQuery('UPDATE reported_complaints SET action_taken = "warned" WHERE complaint_id = ? AND action_taken IS NULL', [id])
    
    // Also notify the user
    await runQuery('INSERT INTO notifications (user_id, message) VALUES (?, ?)', [complaint.user_id, `You have received a warning regarding your complaint "${complaint.title}". Please acknowledge it in the tracking section.`])

    res.json({ success: true, message: 'Warning issued' })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// POST /api/complaints/:id/acknowledge-warning - User: acknowledge warning
router.post('/:id/acknowledge-warning', requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    const [complaint] = await runQuery('SELECT * FROM complaints WHERE id = ? AND user_id = ?', [id, req.user.id])
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' })
    if (complaint.status !== 'Warned') return res.status(400).json({ error: 'Complaint is not in warned state' })

    await runQuery('UPDATE complaints SET status = "Warned (Acknowledged)" WHERE id = ?', [id])
    res.json({ success: true, message: 'Warning acknowledged' })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// POST /api/complaints/:id/reject - Ministry: Reject complaint
router.post('/:id/reject', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'ministry') return res.status(403).json({ error: 'Access denied' })
    const { id } = req.params
    // Ensure complaint belongs to this ministry
    const [complaint] = await runQuery('SELECT user_id FROM complaints WHERE id = ? AND ministry_id = ?', [id, req.user.department_id])
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' })

    await runQuery('UPDATE complaints SET status = "Rejected" WHERE id = ?', [id])
    await runQuery('INSERT INTO notifications (user_id, message) VALUES (?, ?)', [complaint.user_id, `Your complaint has been rejected by the ministry. Please check the rejection details in your history.`])
    res.json({ success: true, message: 'Complaint rejected' })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// POST /api/complaints/:id/acknowledge-rejection - User: acknowledge rejection
router.post('/:id/acknowledge-rejection', requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    const [complaint] = await runQuery('SELECT * FROM complaints WHERE id = ? AND user_id = ?', [id, req.user.id])
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' })
    if (complaint.status !== 'Rejected') return res.status(400).json({ error: 'Complaint is not in rejected state' })

    await runQuery('UPDATE complaints SET status = "Rejected (Acknowledged)" WHERE id = ?', [id])
    res.json({ success: true, message: 'Rejection acknowledged' })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

export default router
