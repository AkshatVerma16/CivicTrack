import { Router } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { runQuery } from '../lib/db.js'

const router = Router()

// POST /api/auth/admin/login
router.post('/admin/login', async (req, res) => {
  const rawEmail = typeof req.body?.email === 'string' ? req.body.email : ''
  const rawPassword = typeof req.body?.password === 'string' ? req.body.password : ''
  const email = rawEmail.trim().toLowerCase()
  const password = rawPassword.trim()
  try {
    const rows = await runQuery('SELECT * FROM admins WHERE LOWER(email) = ? LIMIT 1', [email])
    const admin = rows[0]
    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    const isBcryptHash = typeof admin.password === 'string' && admin.password.startsWith('$2')
    const passwordMatches = isBcryptHash
      ? await bcrypt.compare(password, admin.password)
      : admin.password === password
    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    const token = jwt.sign({ id: admin.id, email: admin.email, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1d' })
    res.json({ token })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

export default router




