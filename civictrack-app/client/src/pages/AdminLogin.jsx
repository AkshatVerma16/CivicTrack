import { useState } from 'react'
import { adminLogin } from '../lib/adminApi'
import { useAdminAuth } from '../context/AdminAuthContext'
import { useNavigate } from 'react-router-dom'

export default function AdminLogin() {
  const [email, setEmail] = useState('admin@example.com')
  const [password, setPassword] = useState('secret')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setToken } = useAdminAuth()
  const navigate = useNavigate()

  const onSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { token } = await adminLogin(email, password)
      setToken(token)
      navigate('/admin')
    } catch (e) {
      setError('Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 rounded-lg border bg-white p-6">
        <h1 className="text-xl font-bold">Admin Login</h1>
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input value={email} onChange={e => setEmail(e.target.value)} className="mt-1 w-full rounded border p-2" type="email" />
        </div>
        <div>
          <label className="block text-sm font-medium">Password</label>
          <input value={password} onChange={e => setPassword(e.target.value)} className="mt-1 w-full rounded border p-2" type="password" />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={loading} className="w-full rounded bg-gray-900 px-4 py-2 font-semibold text-white disabled:opacity-50">{loading ? 'Signing in...' : 'Sign in'}</button>
      </form>
    </div>
  )
}




