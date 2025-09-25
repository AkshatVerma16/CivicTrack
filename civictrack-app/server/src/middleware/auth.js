import jwt from 'jsonwebtoken'

export function requireAdmin(req, res, next) {
  try {
    const header = req.headers.authorization || ''
    const [, token] = header.split(' ')
    if (!token) return res.status(401).json({ error: 'Missing token' })
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    if (!payload?.role || payload.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' })
    }
    req.admin = { id: payload.id, email: payload.email }
    next()
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}


