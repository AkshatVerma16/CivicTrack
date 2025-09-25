import 'dotenv/config'
import { runQuery } from '../lib/db.js'

const test = async () => {
  try {
    const users = await runQuery('SELECT * FROM users')
    console.log(users)
    process.exit(0)
  } catch (err) {
    console.error('DB Error:', err)
    process.exit(1)
  }
}

test()



