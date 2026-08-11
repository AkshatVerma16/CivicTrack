import { Router } from 'express'
import { getPool, runQuery } from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { upload } from '../middleware/upload.js'

const router = Router()

// POST /api/tasks/assign - assign complaint to vendor
router.post('/assign', requireAuth, async (req, res) => {
  const connection = await getPool().getConnection()
  try {
    const { complaint_id, vendor_id } = req.body
    if (!complaint_id || !vendor_id) {
      return res.status(400).json({ error: 'complaint_id and vendor_id are required' })
    }

    await connection.beginTransaction()

    const [complaintRows] = await connection.query('SELECT * FROM complaints WHERE id = ?', [complaint_id])
    const complaint = complaintRows[0]
    if (!complaint) {
      await connection.rollback()
      return res.status(404).json({ error: 'Complaint not found' })
    }

    const [vendorRows] = await connection.query(`
      SELECT v.* FROM vendors v
      JOIN users u ON v.user_id = u.id
      WHERE v.id = ? AND v.ministry_id = ?
    `, [vendor_id, complaint.ministry_id])
    if (vendorRows.length === 0) {
      await connection.rollback()
      return res.status(400).json({ error: 'Invalid vendor for this complaint' })
    }

    const [result] = await connection.query(
      `INSERT INTO tasks (complaint_id, vendor_id, completion_percentage, status_updates)
       VALUES (?, ?, 0, 'Assigned to vendor')`,
      [complaint_id, vendor_id]
    )

    await connection.query('UPDATE complaints SET status = ? WHERE id = ?', ['In Progress', complaint_id])

    await connection.query(
      'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
      [req.user.id, 'assign_task', `Assigned task ${result.insertId} to vendor ${vendor_id}`]
    )

    await connection.commit()

    const [createdRows] = await connection.query('SELECT * FROM tasks WHERE id = ?', [result.insertId])
    res.status(201).json(createdRows[0])
  } catch (e) {
    await connection.rollback()
    res.status(500).json({ error: e.message })
  } finally {
    connection.release()
  }
})

// GET /api/tasks/ministry - get tasks for ministry user's ministry
router.get('/ministry', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'ministry') {
      return res.status(403).json({ error: 'Access denied' })
    }
    const rows = await runQuery(`
      SELECT t.*, c.title as complaint_title, c.description as complaint_description,
             c.status as complaint_status, c.image_url as complaint_image_url,
             c.user_id as complaint_user_id, c.confirmed_at as complaint_confirmed_at,
             v.user_id as vendor_user_id, u.name as vendor_name
      FROM tasks t
      JOIN complaints c ON t.complaint_id = c.id
      LEFT JOIN vendors v ON t.vendor_id = v.id
      LEFT JOIN users u ON v.user_id = u.id
      WHERE c.ministry_id = ?
      ORDER BY t.created_at DESC
    `, [req.user.department_id])
    res.json(rows)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// GET /api/tasks/vendor/tasks - get tasks assigned to the logged-in vendor
router.get('/vendor/tasks', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'vendor') {
      return res.status(403).json({ error: 'Access denied' })
    }
    const rows = await runQuery(`
      SELECT t.*, c.title, c.description, c.image_url, c.ministry_id, c.status as complaint_status,
             c.confirmed_at as complaint_confirmed_at,
             m.name as ministry_name
      FROM tasks t
      JOIN complaints c ON t.complaint_id = c.id
      JOIN ministries m ON c.ministry_id = m.id
      JOIN vendors v ON t.vendor_id = v.id
      WHERE v.user_id = ?
      ORDER BY t.created_at DESC
    `, [req.user.id])
    res.json(rows)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// PATCH /api/tasks/:taskId/progress - update task progress
router.patch('/:taskId/progress', requireAuth, async (req, res) => {
  const { taskId } = req.params
  const { progress } = req.body

  if (typeof progress !== 'number' || progress < 0 || progress > 100) {
    return res.status(400).json({ error: 'Progress must be a number between 0 and 100' })
  }

  const connection = await getPool().getConnection()
  try {
    await connection.beginTransaction()

    const [taskRows] = await connection.query(`
      SELECT t.* FROM tasks t
      JOIN vendors v ON t.vendor_id = v.id
      WHERE t.id = ? AND v.user_id = ?
    `, [taskId, req.user.id])

    if (taskRows.length === 0) {
      await connection.rollback()
      return res.status(404).json({ error: 'Task not found or access denied' })
    }

    const currentTask = taskRows[0]
    const timestamp = new Date().toISOString()
    const statusUpdate = `[${timestamp}] Progress updated from ${currentTask.completion_percentage}% to ${progress}%`

    const existingUpdates = currentTask.status_updates || ''
    const updatedStatusUpdates = existingUpdates
      ? `${existingUpdates}\n${statusUpdate}`
      : statusUpdate

    await connection.query(
      'UPDATE tasks SET completion_percentage = ?, status_updates = ? WHERE id = ?',
      [progress, updatedStatusUpdates, taskId]
    )

    // Get complaint details for notification
    const [complaintRows] = await connection.query('SELECT title, user_id FROM complaints WHERE id = ?', [currentTask.complaint_id])
    const complaint = complaintRows[0]

    let message = `Your complaint "${complaint.title}" progress updated to ${progress}%.`

    await connection.query(
      'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
      [complaint.user_id, message]
    )

    await connection.query(
      'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
      [req.user.id, 'update_progress', `Task ${taskId} progress updated to ${progress}%`]
    )

    await connection.commit()

    const [updatedRows] = await connection.query('SELECT * FROM tasks WHERE id = ?', [taskId])
    res.json(updatedRows[0])
  } catch (e) {
    await connection.rollback()
    res.status(500).json({ error: e.message })
  } finally {
    connection.release()
  }
})

// POST /api/tasks/:taskId/upload-progress - Vendor uploads a progress photo
router.post('/:taskId/upload-progress', requireAuth, upload.single('photo'), async (req, res) => {
  try {
    if (req.user.role !== 'vendor') return res.status(403).json({ error: 'Only vendors can upload progress' })

    const { taskId } = req.params

    // Verify task belongs to this vendor
    const [task] = await runQuery(`
      SELECT t.* FROM tasks t
      JOIN vendors v ON t.vendor_id = v.id
      WHERE t.id = ? AND v.user_id = ?
    `, [taskId, req.user.id])

    if (!task) return res.status(404).json({ error: 'Task not found or access denied' })

    if (!req.file) return res.status(400).json({ error: 'No photo uploaded' })

    const photoUrl = `/${process.env.UPLOAD_DIR || 'uploads'}/${req.file.filename}`

    // Append to progress_photos (comma-separated)
    const existing = task.progress_photos || ''
    const updated = existing ? `${existing},${photoUrl}` : photoUrl

    await runQuery('UPDATE tasks SET progress_photos = ? WHERE id = ?', [updated, taskId])

    // Add status update entry
    const timestamp = new Date().toISOString()
    const statusUpdate = `[${timestamp}] Progress photo uploaded`
    const existingUpdates = task.status_updates || ''
    const updatedStatusUpdates = existingUpdates ? `${existingUpdates}\n${statusUpdate}` : statusUpdate
    await runQuery('UPDATE tasks SET status_updates = ? WHERE id = ?', [updatedStatusUpdates, taskId])

    res.json({ success: true, photo_url: photoUrl })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// POST /api/tasks/:taskId/mark-complete - Vendor marks task complete with final photo
router.post('/:taskId/mark-complete', requireAuth, upload.single('completion_photo'), async (req, res) => {
  try {
    if (req.user.role !== 'vendor') return res.status(403).json({ error: 'Only vendors can mark tasks complete' })

    const { taskId } = req.params

    // Verify task belongs to this vendor
    const [task] = await runQuery(`
      SELECT t.* FROM tasks t
      JOIN vendors v ON t.vendor_id = v.id
      WHERE t.id = ? AND v.user_id = ?
    `, [taskId, req.user.id])

    if (!task) return res.status(404).json({ error: 'Task not found or access denied' })
    if (task.vendor_completed_at) return res.status(400).json({ error: 'Task already marked as complete' })

    const completionPhotoUrl = req.file
      ? `/${process.env.UPLOAD_DIR || 'uploads'}/${req.file.filename}`
      : null

    const timestamp = new Date().toISOString()
    const statusUpdate = `[${timestamp}] Vendor marked task as complete`
    const existingUpdates = task.status_updates || ''
    const updatedStatusUpdates = existingUpdates ? `${existingUpdates}\n${statusUpdate}` : statusUpdate

    await runQuery(
      `UPDATE tasks SET completion_percentage = 100, completion_photo_url = ?,
       vendor_completed_at = NOW(), status_updates = ? WHERE id = ?`,
      [completionPhotoUrl, updatedStatusUpdates, taskId]
    )

    // Update complaint status to 'Vendor Complete'
    await runQuery('UPDATE complaints SET status = "Vendor Complete" WHERE id = ?', [task.complaint_id])

    // Notify the ministry
    const [complaint] = await runQuery('SELECT title, user_id, ministry_id FROM complaints WHERE id = ?', [task.complaint_id])
    if (complaint) {
      // Find ministry user to notify
      const ministryUsers = await runQuery('SELECT id FROM users WHERE role = "ministry" AND ministry_id = ?', [complaint.ministry_id])
      for (const mu of ministryUsers) {
        await runQuery(
          'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
          [mu.id, `Vendor has completed work on complaint "${complaint.title}". Please review and approve.`]
        )
      }
    }

    res.json({ success: true, message: 'Task marked as complete. Awaiting ministry approval.' })
  } catch (e) {
    console.error('Mark complete error:', e)
    res.status(500).json({ error: e.message })
  }
})

// POST /api/tasks/:taskId/ministry-approve - Ministry approves vendor completion
router.post('/:taskId/ministry-approve', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'ministry' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only ministry or admin can approve completions' })
    }

    const { taskId } = req.params

    const [task] = await runQuery('SELECT * FROM tasks WHERE id = ?', [taskId])
    if (!task) return res.status(404).json({ error: 'Task not found' })
    if (!task.vendor_completed_at) return res.status(400).json({ error: 'Vendor has not marked this task as complete' })
    if (task.ministry_approved_at) return res.status(400).json({ error: 'Already approved' })

    // Verify complaint belongs to this ministry (admin can approve any)
    const [complaint] = await runQuery('SELECT * FROM complaints WHERE id = ?', [task.complaint_id])
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' })
    if (req.user.role === 'ministry' && complaint.ministry_id !== req.user.department_id) {
      return res.status(403).json({ error: 'Not authorized for this complaint' })
    }

    // Approve
    const timestamp = new Date().toISOString()
    const statusUpdate = `[${timestamp}] Ministry approved completion`
    const existingUpdates = task.status_updates || ''
    const updatedStatusUpdates = existingUpdates ? `${existingUpdates}\n${statusUpdate}` : statusUpdate

    await runQuery(
      'UPDATE tasks SET ministry_approved_at = NOW(), status_updates = ? WHERE id = ?',
      [updatedStatusUpdates, taskId]
    )

    // Update complaint status to 'Complete' - awaiting user confirmation
    await runQuery('UPDATE complaints SET status = "Complete" WHERE id = ?', [task.complaint_id])

    // Notify the citizen
    await runQuery(
      'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
      [complaint.user_id, `Your complaint "${complaint.title}" has been completed. Please review and confirm.`]
    )

    res.json({ success: true, message: 'Completion approved. Awaiting user confirmation.' })
  } catch (e) {
    console.error('Ministry approve error:', e)
    res.status(500).json({ error: e.message })
  }
})

export default router