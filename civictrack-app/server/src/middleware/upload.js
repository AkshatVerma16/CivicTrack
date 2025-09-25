import fs from 'fs'
import path from 'path'
import multer from 'multer'

const uploadDir = process.env.UPLOAD_DIR || 'uploads'
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname)
    cb(null, unique + ext)
  },
})

export const upload = multer({ storage })







