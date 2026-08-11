import { Router } from 'express'
import { getPool, runQuery } from '../db.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'

const router = Router()

// GET /api/payments/pending - Ministry: fetch completed (Archived) tasks needing payment approval
router.get('/pending', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'ministry') return res.status(403).json({ error: 'Access denied' })

    const rows = await runQuery(`
      SELECT t.*, c.title as complaint_title, c.status as complaint_status,
             b.id as bid_id, b.budget as accepted_bid_amount,
             v.bank_name, v.account_number, v.ifsc_code,
             u.name as vendor_name,
             p.id as payment_id, p.status as payment_status, p.transaction_id
      FROM tasks t
      JOIN complaints c ON t.complaint_id = c.id
      JOIN bids b ON b.complaint_id = c.id AND b.vendor_id = t.vendor_id AND b.status = 'accepted'
      JOIN vendors v ON t.vendor_id = v.id
      JOIN users u ON v.user_id = u.id
      LEFT JOIN payments p ON p.task_id = t.id
      WHERE c.ministry_id = ? AND c.status = 'Archived'
      ORDER BY t.updated_at DESC
    `, [req.user.department_id])

    res.json(rows)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// GET /api/payments/requests - Admin: fetch payment requests forwarded by Ministry
router.get('/requests', requireAdmin, async (req, res) => {
  try {
    const rows = await runQuery(`
      SELECT p.*, m.name as ministry_name, u.name as vendor_name, c.title as complaint_title
      FROM payments p
      JOIN ministries m ON p.ministry_id = m.id
      JOIN vendors v ON p.vendor_id = v.id
      JOIN users u ON v.user_id = u.id
      JOIN tasks t ON p.task_id = t.id
      JOIN complaints c ON t.complaint_id = c.id
      ORDER BY p.created_at DESC
    `)
    res.json(rows)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// GET /api/payments/ministry - get available and requested payments for ministry
router.get('/ministry', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'ministry') return res.status(403).json({ error: 'Access denied' })
    
    const rows = await runQuery(`
      SELECT t.*, c.title as complaint_title, c.status as complaint_status,
             b.id as bid_id, b.budget as accepted_bid_amount,
             v.bank_name, v.account_number, v.ifsc_code,
             u.name as vendor_name,
             p.id as payment_id, p.status as payment_status, p.transaction_id
      FROM tasks t
      JOIN complaints c ON t.complaint_id = c.id
      JOIN bids b ON b.complaint_id = c.id AND b.vendor_id = t.vendor_id AND b.status = 'accepted'
      JOIN vendors v ON t.vendor_id = v.id
      JOIN users u ON v.user_id = u.id
      LEFT JOIN payments p ON p.task_id = t.id
      WHERE c.ministry_id = ? AND c.status = 'Archived'
      ORDER BY t.updated_at DESC
    `, [req.user.department_id])
    
    res.json(rows)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// POST /api/payments/request - ministry requests payment for a task
router.post('/request', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'ministry') return res.status(403).json({ error: 'Access denied' })
    
    const { task_id } = req.body
    
    const [taskInfo] = await runQuery(`
      SELECT t.vendor_id, b.id as bid_id, b.budget, v.bank_name, v.account_number, v.ifsc_code, c.ministry_id
      FROM tasks t
      JOIN complaints c ON t.complaint_id = c.id
      JOIN bids b ON b.complaint_id = c.id AND b.vendor_id = t.vendor_id AND b.status = 'accepted'
      JOIN vendors v ON t.vendor_id = v.id
      WHERE t.id = ? AND c.ministry_id = ? AND c.status = 'Archived'
    `, [task_id, req.user.department_id])

    if (!taskInfo) return res.status(404).json({ error: 'Valid completed task not found' })

    const [existingPayment] = await runQuery('SELECT id FROM payments WHERE task_id = ?', [task_id])
    if (existingPayment) return res.status(400).json({ error: 'Payment request already exists' })

    const bankDetails = JSON.stringify({
      bank_name: taskInfo.bank_name,
      account_number: taskInfo.account_number,
      ifsc_code: taskInfo.ifsc_code
    })

    await runQuery(`
      INSERT INTO payments (bid_id, task_id, vendor_id, ministry_id, amount, bank_details, status)
      VALUES (?, ?, ?, ?, ?, ?, 'pending_approval')
    `, [taskInfo.bid_id, task_id, taskInfo.vendor_id, taskInfo.ministry_id, taskInfo.budget, bankDetails])

    res.json({ success: true, message: 'Payment requested successfully' })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// GET /api/payments/admin - get all payments for admin
router.get('/admin', requireAdmin, async (req, res) => {
  try {
    const rows = await runQuery(`
      SELECT p.*, m.name as ministry_name, u.name as vendor_name, c.title as complaint_title
      FROM payments p
      JOIN ministries m ON p.ministry_id = m.id
      JOIN vendors v ON p.vendor_id = v.id
      JOIN users u ON v.user_id = u.id
      JOIN tasks t ON p.task_id = t.id
      JOIN complaints c ON t.complaint_id = c.id
      ORDER BY p.created_at DESC
    `)
    res.json(rows)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// POST /api/payments/:id/disburse - admin disburses payment
router.post('/:id/disburse', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const [payment] = await runQuery('SELECT * FROM payments WHERE id = ?', [id])
    
    if (!payment) return res.status(404).json({ error: 'Payment not found' })
    if (payment.status === 'paid') return res.status(400).json({ error: 'Payment already disbursed' })

    // Simulate Bank API
    const transactionId = 'TXN' + Math.random().toString(36).substr(2, 9).toUpperCase()

    await runQuery(`
      UPDATE payments SET status = 'paid', transaction_id = ? WHERE id = ?
    `, [transactionId, id])

    // Get vendor user_id for notification
    const [vendor] = await runQuery('SELECT user_id FROM vendors WHERE id = ?', [payment.vendor_id])
    
    if (vendor) {
      await runQuery(
        'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
        [vendor.user_id, `Payment of ₹${payment.amount} for your completed task has been successfully disbursed. TXN ID: ${transactionId}`]
      )
    }

    res.json({ success: true, transaction_id: transactionId })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

export default router
