import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { runQuery } from '../db.js'
import { requireAdmin } from '../middleware/auth.js'

const router = Router()

// POST /api/admin/reset-password
router.post('/', requireAdmin, async (req, res) => {
  const { id, password } = req.body
  if (!id || !password || password.length < 6) {
    return res.status(400).json({ error: 'Valid user/ministry id and password (min 6 chars) required' })
  }
  try {
    const hashed = await bcrypt.hash(password, 10)
    const result = await runQuery('UPDATE users SET password = ? WHERE id = ?', [hashed, id])
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User or ministry not found' })
    }
    res.json({ success: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

export default router
