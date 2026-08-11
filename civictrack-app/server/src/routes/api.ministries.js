import { Router } from 'express'
import bcryptjs from 'bcryptjs'
import { runQuery } from '../db.js'
import { requireAdmin } from '../middleware/auth.js'

const router = Router()

// GET /api/ministries/public - get all ministries (public endpoint for users)
router.get('/public', async (req, res) => {
  try {
    const rows = await runQuery(`
      SELECT id, name, icon_identifier
      FROM ministries
      ORDER BY name
    `)
    res.json(rows)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// GET /api/ministries - get all ministries (admin only - includes email info)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const rows = await runQuery(`
      SELECT
        m.*,
        u.email AS ministry_email,
        SUBSTRING_INDEX(u.email, '@', 1) AS ministry_username,
        u.password AS ministry_password
      FROM ministries m
      LEFT JOIN users u ON u.ministry_id = m.id AND u.role = 'ministry'
      ORDER BY m.name
    `)
    res.json(rows)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// POST /api/ministries - create ministry
router.post('/', requireAdmin, async (req, res) => {
  const { name, icon_identifier, username, password } = req.body
  if (!name) {
    return res.status(400).json({ error: 'Ministry name is required' })
  }

  let ministryResult = null
  try {
    // Create ministry first
    ministryResult = await runQuery(
      'INSERT INTO ministries (name, icon_identifier) VALUES (?, ?)',
      [name.trim(), icon_identifier || null]
    )
    const ministryId = ministryResult.insertId

    // If username and password provided, create ministry user
    if (username && password) {
      const email = `${username}@ministry.local`
      const hashedPassword = await bcryptjs.hash(password, 10)
      
      await runQuery(
        'INSERT INTO users (name, email, password, role, ministry_id) VALUES (?, ?, ?, ?, ?)',
        [name.trim(), email, hashedPassword, 'ministry', ministryId]
      )
    }

    const [created] = await runQuery('SELECT * FROM ministries WHERE id = ?', [ministryId])
    res.status(201).json(created)
  } catch (e) {
    // If error, try to clean up the created ministry
    if (ministryResult?.insertId) {
      await runQuery('DELETE FROM ministries WHERE id = ?', [ministryResult.insertId]).catch(() => {})
    }
    res.status(500).json({ error: e.message })
  }
})

// PUT /api/ministries/:id - update ministry
router.put('/:id', requireAdmin, async (req, res) => {
  const { name, icon_identifier } = req.body
  const { id } = req.params
  if (!name) {
    return res.status(400).json({ error: 'Ministry name is required' })
  }

  try {
    await runQuery(
      'UPDATE ministries SET name = ?, icon_identifier = ? WHERE id = ?',
      [name.trim(), icon_identifier || null, id]
    )
    const [updated] = await runQuery('SELECT * FROM ministries WHERE id = ?', [id])
    res.json(updated)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// DELETE /api/ministries/:id - delete ministry (cascades related data)
router.delete('/:id', requireAdmin, async (req, res) => {
  const { id } = req.params
  try {
    // 1. Get all complaints for this ministry
    const complaints = await runQuery('SELECT id FROM complaints WHERE ministry_id = ?', [id])
    const complaintIds = complaints.map(c => c.id)

    if (complaintIds.length > 0) {
      // 2. Delete bids for these complaints
      await runQuery(`DELETE FROM bids WHERE complaint_id IN (${complaintIds.map(() => '?').join(',')})`, complaintIds)

      // 3. Delete tasks for these complaints
      await runQuery(`DELETE FROM tasks WHERE complaint_id IN (${complaintIds.map(() => '?').join(',')})`, complaintIds)

      // 4. Delete the complaints themselves
      await runQuery(`DELETE FROM complaints WHERE ministry_id = ?`, [id])
    }

    // 5. Get vendors for this ministry and delete their tasks
    const vendors = await runQuery('SELECT id FROM vendors WHERE ministry_id = ?', [id])
    for (const vendor of vendors) {
      await runQuery('DELETE FROM tasks WHERE vendor_id = ?', [vendor.id])
    }

    // 6. Delete vendors for this ministry
    await runQuery('DELETE FROM vendors WHERE ministry_id = ?', [id])

    // 7. Delete reported_bids referencing ministry users
    const ministryUsers = await runQuery('SELECT id FROM users WHERE ministry_id = ? AND role = ?', [id, 'ministry'])
    for (const mu of ministryUsers) {
      await runQuery('DELETE FROM reported_bids WHERE ministry_id = ?', [mu.id])
      await runQuery('DELETE FROM notifications WHERE user_id = ?', [mu.id])
      await runQuery('DELETE FROM activity_logs WHERE user_id = ?', [mu.id])
    }

    // 8. Delete users with role='ministry' associated with this ministry
    await runQuery('DELETE FROM users WHERE ministry_id = ? AND role = ?', [id, 'ministry'])

    // 9. Set ministry_id to NULL for any remaining users linked to this ministry
    await runQuery('UPDATE users SET ministry_id = NULL WHERE ministry_id = ?', [id])

    // 10. Delete the ministry
    await runQuery('DELETE FROM ministries WHERE id = ?', [id])
    res.status(204).send()
  } catch (e) {
    console.error('Delete ministry error:', e)
    res.status(500).json({ error: e.message })
  }
})

// GET /api/ministries/:id/vendors - get vendors for a ministry
router.get('/:id/vendors', requireAdmin, async (req, res) => {
  try {
    const rows = await runQuery(`
      SELECT v.id, u.name, u.email
      FROM vendors v
      JOIN users u ON v.user_id = u.id
      WHERE v.ministry_id = ?
      ORDER BY u.name
    `, [req.params.id])
    res.json(rows)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

export default router