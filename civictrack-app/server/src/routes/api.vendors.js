// List all pending vendor applications (admin only, simple auth check)
router.get('/applications', async (req, res) => {
  // TODO: Add real admin authentication/authorization
  try {
    const [rows] = await db.query('SELECT * FROM vendor_applications WHERE status = "Pending" ORDER BY created_at DESC')
    res.json(rows)
  import express from 'express'
  import { pool } from '../db.js'
  import bcrypt from 'bcryptjs'

  const router = express.Router()

  // Example vendor route
  router.get('/', (req, res) => {
    res.json({ message: 'Vendor API is working!' })
  })

  // Vendor application submission
  router.post('/apply', async (req, res) => {
    const { name, email, phone, company, password } = req.body
    if (!name || !email || !phone || !company || !password) {
      return res.status(400).json({ error: 'All fields are required.' })
    }
    try {
      // Check if email already exists in applications or vendors
      const [existing] = await pool.query('SELECT id FROM vendor_applications WHERE email = ? UNION SELECT id FROM vendors WHERE email = ?', [email, email])
      if (existing.length > 0) {
        return res.status(409).json({ error: 'Email already registered.' })
      }
      const hashedPassword = await bcrypt.hash(password, 10)
      await pool.query(
        'INSERT INTO vendor_applications (name, email, phone, company, password, status, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
        [name, email, phone, company, hashedPassword, 'Pending']
      )
      res.json({ message: 'Application submitted.' })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Server error.' })
    }
  })

  // List all pending vendor applications (admin only, simple auth check)
  router.get('/applications', async (req, res) => {
    // TODO: Add real admin authentication/authorization
    try {
      const [rows] = await pool.query('SELECT * FROM vendor_applications WHERE status = "Pending" ORDER BY created_at DESC')
      res.json(rows)
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch applications.' })
    }
  })

  // Approve a vendor application
  router.post('/applications/:id/approve', async (req, res) => {
    const { id } = req.params
    try {
      // Get application
      const [[app]] = await pool.query('SELECT * FROM vendor_applications WHERE id = ?', [id])
      if (!app) return res.status(404).json({ error: 'Application not found.' })
      // Insert into vendors table (or users table with role 'vendor')
      await pool.query('INSERT INTO vendors (name, email, phone, company, password, created_at) VALUES (?, ?, ?, ?, ?, NOW())', [app.name, app.email, app.phone, app.company, app.password])
      // Mark application as approved
      await pool.query('UPDATE vendor_applications SET status = "Approved" WHERE id = ?', [id])
      res.json({ message: 'Vendor approved.' })
    } catch (err) {
      res.status(500).json({ error: 'Failed to approve application.' })
    }
  })

  // Reject a vendor application
  router.post('/applications/:id/reject', async (req, res) => {
    const { id } = req.params
    try {
      await pool.query('UPDATE vendor_applications SET status = "Rejected" WHERE id = ?', [id])
      res.json({ message: 'Application rejected.' })
    } catch (err) {
      res.status(500).json({ error: 'Failed to reject application.' })
    }
  })

  export default router
