const url = 'http://localhost:3000/api/auth/admin/login'
const body = { email: 'admin@example.com', password: 'secret' }

;(async () => {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const text = await res.text()
    console.log('Status:', res.status)
    console.log('Body:', text)
  } catch (e) {
    console.error('Request error:', e.message)
  }
})()


