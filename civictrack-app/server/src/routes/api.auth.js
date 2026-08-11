import { Router } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { runQuery } from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { upload } from '../middleware/upload.js'

const router = Router()

// POST /api/auth/admin/login
router.post('/admin/login', async (req, res) => {
  const rawIdentifier = typeof req.body?.identifier === 'string' ? req.body.identifier : ''
  const rawPassword = typeof req.body?.password === 'string' ? req.body.password : ''
  const identifier = rawIdentifier.trim()
  const password = rawPassword.trim()

  if (!identifier || !password) {
    return res.status(400).json({ error: 'Username/email and password are required' })
  }

  const normalized = identifier.toLowerCase()
  try {
    const rows = await runQuery(
      `SELECT * FROM users WHERE role = 'admin' AND (
         LOWER(email) = ? OR
         LOWER(SUBSTRING_INDEX(email, '@', 1)) = ? OR
         LOWER(name) = ?
       ) LIMIT 1`,
      [normalized, normalized, normalized]
    )
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

    const secret = process.env.JWT_SECRET || 'dev-secret-change-me'
    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: 'admin' },
      secret,
      { expiresIn: '1d' },
    )
    res.json({ token })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

const isValidEmail = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
const getPasswordPolicyError = password => {
  if (password.length < 8) return 'Password must be at least 8 characters long.'
  if (!/[A-Z]/.test(password)) return 'Password must include at least one uppercase letter.'
  if (!/[0-9]/.test(password)) return 'Password must include at least one digit.'
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'Password must include at least one special character.'
  return ''
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const rawIdentifier = typeof req.body?.identifier === 'string'
    ? req.body.identifier
    : typeof req.body?.email === 'string'
      ? req.body.email
      : ''
  const rawPassword = typeof req.body?.password === 'string' ? req.body.password : ''
  const identifier = rawIdentifier.trim().toLowerCase()
  const password = rawPassword.trim()

  if (!identifier || !password) {
    return res.status(400).json({ error: 'Email/username and password are required' })
  }

  try {
    const rows = await runQuery(
      `SELECT id, name, email, role, ministry_id FROM users WHERE
         LOWER(email) = ? OR
         LOWER(SUBSTRING_INDEX(email, '@', 1)) = ? OR
         LOWER(name) = ?
       LIMIT 1`,
      [identifier, identifier, identifier]
    )
    const user = rows[0]
    if (!user) {
      // Check vendor_applications for pending/rejected vendors
      const vendorRows = await runQuery(
        'SELECT status FROM vendor_applications WHERE LOWER(email) = ? LIMIT 1',
        [identifier]
      )
      if (vendorRows.length > 0) {
        const status = vendorRows[0].status
        if (status === 'Pending') {
          return res.status(403).json({ error: 'Your vendor application is pending admin approval.' })
        }
        if (status === 'Rejected') {
          return res.status(403).json({ error: 'Your vendor application was rejected.' })
        }
      }
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Get the hashed password
    const passwordRows = await runQuery('SELECT password FROM users WHERE id = ?', [user.id])
    const hashedPassword = passwordRows[0]?.password

    if (!hashedPassword) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const passwordMatches = await bcrypt.compare(password, hashedPassword)
    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const secret = process.env.JWT_SECRET || 'dev-secret-change-me'
    const token = jwt.sign(
      { id: user.id, role: user.role, department_id: user.ministry_id },
      secret,
      { expiresIn: '1d' },
    )

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { first_name, middle_name, last_name, email: rawEmail, password } = req.body
  const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : ''

  if (!first_name?.trim() || !last_name?.trim() || !email || !password) {
    return res.status(400).json({ error: 'First name, last name, email, and password are required' })
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Enter a valid email address' })
  }

  const passwordError = getPasswordPolicyError(password)
  if (passwordError) {
    return res.status(400).json({ error: passwordError })
  }

  // Registration ALWAYS creates citizen (user) role accounts
  // Admins can promote to ministry/vendor roles later
  const userRole = 'user'
  const fullName = `${first_name.trim()}${middle_name?.trim() ? ` ${middle_name.trim()}` : ''} ${last_name.trim()}`.trim()

  try {
    // Check if user already exists
    const existingRows = await runQuery('SELECT id FROM users WHERE LOWER(email) = ? LIMIT 1', [email])
    if (existingRows.length > 0) {
      return res.status(409).json({ error: 'User already exists' })
    }

    // Hash the password
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Insert new user with citizen role only
    const result = await runQuery(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [fullName, email, hashedPassword, userRole]
    )

    const [newUser] = await runQuery('SELECT id, name, email, role FROM users WHERE id = ?', [result.insertId])

    res.status(201).json({
      message: 'Citizen account created successfully. You can now login and report issues.',
      user: newUser
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// GET /api/auth/me - get current user details
router.get('/me', requireAuth, async (req, res) => {
  try {
    const rows = await runQuery(
      `SELECT id, name, email, role, phone, address, city, state, postal_code,
              government_id_type, government_id_number, profile_picture, government_id_image_url 
       FROM users WHERE id = ?`,
      [req.user.id]
    )
    const user = rows[0]
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    res.json(user)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// PATCH /api/auth/update - update user profile with files
router.patch('/update', requireAuth, upload.fields([
  { name: 'profile_picture', maxCount: 1 },
  { name: 'government_id_image', maxCount: 1 }
]), async (req, res) => {
  const {
    name, password, email, phone, address, city, state, postal_code,
    government_id_type, government_id_number
  } = req.body

  try {
    let updateFields = []
    let updateValues = []

    // Update name
    if (name && name.trim() !== '') {
      updateFields.push('name = ?')
      updateValues.push(name.trim())
    }

    // Update email
    if (email && email.trim() !== '') {
      updateFields.push('email = ?')
      updateValues.push(email.trim())
    }

    // Update password
    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 10)
      updateFields.push('password = ?')
      updateValues.push(hashedPassword)
    }

    // Update phone
    if (phone && phone.trim() !== '') {
      updateFields.push('phone = ?')
      updateValues.push(phone.trim())
    }

    // Update address
    if (address && address.trim() !== '') {
      updateFields.push('address = ?')
      updateValues.push(address.trim())
    }

    // Update city
    if (city && city.trim() !== '') {
      updateFields.push('city = ?')
      updateValues.push(city.trim())
    }

    // Update state
    if (state && state.trim() !== '') {
      updateFields.push('state = ?')
      updateValues.push(state.trim())
    }

    // Update postal_code
    if (postal_code && postal_code.trim() !== '') {
      updateFields.push('postal_code = ?')
      updateValues.push(postal_code.trim())
    }

    // Update government_id_type
    if (government_id_type && government_id_type.trim() !== '') {
      updateFields.push('government_id_type = ?')
      updateValues.push(government_id_type.trim())
    }

    // Update government_id_number
    if (government_id_number && government_id_number.trim() !== '') {
      updateFields.push('government_id_number = ?')
      updateValues.push(government_id_number.trim())
    }

    // Handle profile picture upload
    if (req.files?.profile_picture?.[0]) {
      const profile_picture_url = `/${process.env.UPLOAD_DIR || 'uploads'}/${req.files.profile_picture[0].filename}`
      updateFields.push('profile_picture = ?')
      updateValues.push(profile_picture_url)
    }

    // Handle government ID image upload
    if (req.files?.government_id_image?.[0]) {
      const gov_id_image_url = `/${process.env.UPLOAD_DIR || 'uploads'}/${req.files.government_id_image[0].filename}`
      updateFields.push('government_id_image_url = ?')
      updateValues.push(gov_id_image_url)
    }

    // If no fields to update, return error
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No changes provided' })
    }

    updateValues.push(req.user.id)

    // Execute update
    await runQuery(`UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`, updateValues)

    // Fetch and return updated user
    const [updatedUser] = await runQuery(
      `SELECT id, name, email, role, phone, address, city, state, postal_code,
              government_id_type, government_id_number, profile_picture, government_id_image_url FROM users WHERE id = ?`,
      [req.user.id]
    )
    res.json(updatedUser)
  } catch (e) {
    console.error('Profile update error:', e)
    res.status(500).json({ error: e.message })
  }
})

export default router




