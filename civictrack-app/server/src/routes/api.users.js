import { Router } from 'express'
import { runQuery } from '../db.js'
import { requireAdmin } from '../middleware/auth.js'

const router = Router()

// GET /api/users - list all users
router.get('/', requireAdmin, async (req, res) => {
  try {
    const rows = await runQuery(`
      SELECT id, name, email, role, ministry_id, created_at, password,
        SUBSTRING_INDEX(email, '@', 1) AS username
      FROM users
      ORDER BY created_at DESC
    `)
    res.json(rows)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// DELETE /api/users/:id - delete a user (cascades related data)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params

    // Check user exists
    const userRows = await runQuery('SELECT * FROM users WHERE id = ?', [id])
    if (!userRows || userRows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Delete in correct order to respect foreign key constraints
    // 1. Delete notifications for this user
    await runQuery('DELETE FROM notifications WHERE user_id = ?', [id])

    // 2. Delete activity logs for this user
    await runQuery('DELETE FROM activity_logs WHERE user_id = ?', [id])

    // 3. Delete reported_bids where this user is the reporter (ministry_id references users)
    await runQuery('DELETE FROM reported_bids WHERE ministry_id = ?', [id])

    // 4. Delete bids by this user (vendor_id references users)
    await runQuery('DELETE FROM bids WHERE vendor_id = ?', [id])

    // 5. Get vendor records for this user, then delete tasks assigned to those vendors
    const vendorRows = await runQuery('SELECT id FROM vendors WHERE user_id = ?', [id])
    for (const vendor of vendorRows) {
      await runQuery('DELETE FROM tasks WHERE vendor_id = ?', [vendor.id])
    }

    // 6. Delete vendor records for this user
    await runQuery('DELETE FROM vendors WHERE user_id = ?', [id])

    // 7. Delete complaints by this user
    await runQuery('DELETE FROM complaints WHERE user_id = ?', [id])

    // 8. Finally delete the user
    await runQuery('DELETE FROM users WHERE id = ?', [id])

    res.status(204).send()
  } catch (e) {
    console.error('Delete user error:', e)
    res.status(500).json({ error: e.message })
  }
})

export default router