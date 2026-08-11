import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const envPath = path.join(__dirname, '..', '.env')
const cwdEnvPath = path.resolve(process.cwd(), '.env')

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath })
} else if (fs.existsSync(cwdEnvPath)) {
  dotenv.config({ path: cwdEnvPath })
} else {
  dotenv.config()
}

import express from 'express'
import cors from 'cors'
import { pool } from './db.js'
import apiAuthRouter from './routes/api.auth.js'
import apiComplaintsRouter from './routes/api.complaints.js'
import apiMinistriesRouter from './routes/api.ministries.js'
import apiTasksRouter from './routes/api.tasks.js'
import apiUsersRouter from './routes/api.users.js'
import apiLogsRouter from './routes/api.logs.js'
import apiNotificationsRouter from './routes/api.notifications.js'
import apiAdminRouter from './routes/api.admin.js'

import apiBidsRouter from './routes/api.bids.js'
import apiVendorsRouter from './routes/api.vendors.js'
import apiPaymentsRouter from './routes/api.payments.js'

console.log('DB_HOST:', process.env.DB_HOST)
console.log('DB_USER:', process.env.DB_USER)
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***' : 'NOT SET')
console.log('DB_PORT:', process.env.DB_PORT)

const app = express()
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}))
app.use(express.json())
// serve uploads statically
app.use(`/${process.env.UPLOAD_DIR || 'uploads'}`, express.static(process.env.UPLOAD_DIR || 'uploads'))

// API routes
app.use('/api/auth', apiAuthRouter)
app.use('/api/complaints', apiComplaintsRouter)
app.use('/api/ministries', apiMinistriesRouter)
app.use('/api/tasks', apiTasksRouter)
app.use('/api/users', apiUsersRouter)
app.use('/api/logs', apiLogsRouter)
app.use('/api/notifications', apiNotificationsRouter)
app.use('/api/admin', apiAdminRouter)

app.use('/api/bids', apiBidsRouter)
app.use('/api/vendors', apiVendorsRouter)
app.use('/api/payments', apiPaymentsRouter)

app.get('/health', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 AS ok')
    res.json({ status: 'ok', db: rows[0].ok === 1 })
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message })
  }
})

const startServer = (port) => {
  const server = app.listen(port, () => {
    console.log(`🚀 CivicTrack server live on http://localhost:${port}`)
  })

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      const nextPort = parseInt(port) + 1
      console.log(`⚠️ Port ${port} is busy, trying ${nextPort}...`)
      startServer(nextPort)
    } else {
      console.error(err)
      process.exit(1)
    }
  })
}

// Handle clean exits
process.on('SIGINT', () => {
  console.log('\nShutting down server safely...')
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\nShutting down server safely...')
  process.exit(0)
})

startServer(process.env.PORT || 3000)


