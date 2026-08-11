import { Router } from 'express'
import { runQuery } from '../db.js'
import { requireAdmin } from '../middleware/auth.js'

const router = Router()

// GET /api/admin/stats - get admin statistics
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    // Complaints per ministry
    const ministryStats = await runQuery(`
      SELECT m.name as ministry, COUNT(c.id) as count
      FROM ministries m
      LEFT JOIN complaints c ON m.id = c.ministry_id
      GROUP BY m.id, m.name
      ORDER BY count DESC
    `)

    // Status distribution
    const statusStats = await runQuery(`
      SELECT status, COUNT(*) as count
      FROM complaints
      GROUP BY status
    `)

    // Complaints trend last 30 days
    const trendStats = await runQuery(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM complaints
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date
    `)

    // Total users
    const [userCount] = await runQuery('SELECT COUNT(*) as total FROM users')

    // Average resolution time (days) for completed complaints
    const [avgResolution] = await runQuery(`
      SELECT AVG(TIMESTAMPDIFF(DAY, created_at, updated_at)) as avg_days
      FROM complaints
      WHERE status IN ('Complete', 'Resolved', 'Archived')
    `)

    res.json({
      ministryStats,
      statusStats,
      trendStats,
      totalUsers: userCount.total,
      avgResolutionTime: avgResolution.avg_days || 0,
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

export default router