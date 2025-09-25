import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { getPool } from './lib/db.js'
import path from 'path'
import apiAuthRouter from './routes/api.auth.js'
import apiComplaintsRouter from './routes/api.complaints.js'

const app = express()
app.use(cors())
app.use(express.json())
// serve uploads statically
app.use(`/${process.env.UPLOAD_DIR || 'uploads'}`, express.static(process.env.UPLOAD_DIR || 'uploads'))

// API routes
app.use('/api/auth', apiAuthRouter)
app.use('/api/complaints', apiComplaintsRouter)

app.get('/health', async (req, res) => {
  try {
    const pool = getPool()
    const [rows] = await pool.query('SELECT 1 AS ok')
    res.json({ status: 'ok', db: rows[0].ok === 1 })
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message })
  }
})

const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`CivicTrack server listening on port ${port}`)
})


