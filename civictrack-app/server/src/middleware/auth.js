import jwt from 'jsonwebtoken'

export function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || ''
    const [, token] = header.split(' ')
    if (!token) return res.status(401).json({ error: 'Missing token' })
    const secret = process.env.JWT_SECRET || 'dev-secret-change-me'
    const payload = jwt.verify(token, secret)
    req.user = {
      id: payload.id,
      role: payload.role,
      email: payload.email,
      department_id: payload.department_id,
      ministry_id: payload.department_id
    }
    next()
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

export function requireAdmin(req, res, next) {
  try {
    const header = req.headers.authorization || ''
    const [, token] = header.split(' ')
    if (!token) return res.status(401).json({ error: 'Missing token' })
    const secret = process.env.JWT_SECRET || 'dev-secret-change-me'
    const payload = jwt.verify(token, secret)
    if (!payload?.role || payload.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' })
    }
    req.admin = { id: payload.id, email: payload.email }
    req.user = { id: payload.id, role: 'admin', email: payload.email }
    next()
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

// Middleware that accepts both ministry and admin roles
export function requireMinistryOrAdmin(req, res, next) {
  try {
    const header = req.headers.authorization || ''
    const [, token] = header.split(' ')
    if (!token) return res.status(401).json({ error: 'Missing token' })
    const secret = process.env.JWT_SECRET || 'dev-secret-change-me'
    const payload = jwt.verify(token, secret)
    if (!payload?.role || (payload.role !== 'ministry' && payload.role !== 'admin')) {
      return res.status(403).json({ error: 'Only ministry or admin can perform this action' })
    }
    req.user = {
      id: payload.id,
      role: payload.role,
      email: payload.email,
      department_id: payload.department_id,
      ministry_id: payload.department_id
    }
    next()
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

