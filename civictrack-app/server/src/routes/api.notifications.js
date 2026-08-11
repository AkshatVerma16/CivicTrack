import { Router } from 'express'
import { runQuery } from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// GET /api/notifications - fetch unread notifications for logged-in user
router.get('/', requireAuth, async (req, res) => {
  try {
    const rows = await runQuery(
      'SELECT * FROM notifications WHERE user_id = ? AND is_read = 0 ORDER BY created_at DESC',
      [req.user.id]
    )
    res.json(rows)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

export default router