import { Router } from 'express'
import fs from 'fs'
import path from 'path'
import { runQuery } from '../lib/db.js'
import { upload } from '../middleware/upload.js'
import { requireAdmin } from '../middleware/auth.js'

const router = Router()

// POST /api/complaints - submit complaint with optional photo
router.post('/', upload.single('photo'), async (req, res) => {
  try {
    const { user_id, description, latitude, longitude, department } = req.body
    if (!user_id) return res.status(400).json({ error: 'user_id is required' })
    if (!req.file && (!description || String(description).trim().length === 0)) {
      return res.status(400).json({ error: 'description or photo is required' })
    }
    const lat = latitude !== undefined && latitude !== null && latitude !== '' ? Number(latitude) : null
    const lng = longitude !== undefined && longitude !== null && longitude !== '' ? Number(longitude) : null
    if ((lat !== null && Number.isNaN(lat)) || (lng !== null && Number.isNaN(lng))) {
      return res.status(400).json({ error: 'latitude/longitude must be numeric' })
    }
    const photo_url = req.file ? `/${process.env.UPLOAD_DIR || 'uploads'}/${req.file.filename}` : null
    const result = await runQuery(
      `INSERT INTO complaints (user_id, description, photo_url, latitude, longitude, department)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [user_id, description ?? null, photo_url, lat, lng, department ?? null]
    )
    const [created] = await runQuery('SELECT * FROM complaints WHERE id = ?', [result.insertId])
    res.status(201).json(created)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// GET /api/complaints/user/:id - list complaints for a user
router.get('/user/:id', async (req, res) => {
  try {
    const rows = await runQuery('SELECT * FROM complaints WHERE user_id = ? ORDER BY created_at DESC', [req.params.id])
    res.json(rows)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// GET /api/complaints - admin: get all complaints
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { status, department } = req.query
    const where = []
    const params = []
    if (status) { where.push('status = ?'); params.push(status) }
    if (department) { where.push('department = ?'); params.push(department) }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
    const rows = await runQuery(`SELECT * FROM complaints ${whereSql} ORDER BY created_at DESC`, params)
    res.json(rows)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// PUT /api/complaints/:id - admin: update status and department
router.put('/:id', requireAdmin, async (req, res) => {
  const { status, department } = req.body
  const { id } = req.params
  try {
    const allowed = ['Pending','In Progress','Resolved']
    if (status && !allowed.includes(status)) {
      return res.status(400).json({ error: 'invalid status' })
    }
    await runQuery('UPDATE complaints SET status = COALESCE(?, status), department = ? WHERE id = ?', [status ?? null, department ?? null, id])
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

export default router

