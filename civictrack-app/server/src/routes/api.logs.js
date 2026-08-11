import { Router } from 'express'
import { runQuery } from '../db.js'
import { requireAdmin } from '../middleware/auth.js'

const router = Router()

// GET /api/logs - system logs for admin
router.get('/', requireAdmin, async (req, res) => {
  try {
    const rows = await runQuery(`
      SELECT a.id, a.user_id, u.name as user_name, a.action, a.details, a.created_at
      FROM activity_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
      LIMIT 200
    `)
    res.json(rows)
  } catch (e) {
    // Fallback if table missing
    if (e.message.includes('activity_logs')) {
      return res.json([])
    }
    res.status(500).json({ error: e.message })
  }
})

export default router