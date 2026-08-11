import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminLogin } from '../lib/adminApi.js'
import { useAdminAuth } from '../context/AdminAuthContext.jsx'

export default function AdminLogin() {
  const [identifier, setIdentifier] = useState('akshat')
  const [password, setPassword] = useState('Akshat@2004')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { setToken } = useAdminAuth()

  const onSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await adminLogin(identifier, password)
      const token = response.token
      setToken(token)
      navigate('/admin')
    } catch (e) {
      // Log the actual error for debugging
      if (e.response) {
        console.log('Admin login error response:', e.response.data)
      } else {
        console.log('Admin login error:', e)
      }
      setError(e.message || 'Invalid credentials')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mb-6 inline-flex items-center text-slate-200 hover:text-white transition-colors text-sm"
        >
          ← Back to Home
        </button>

        <form onSubmit={onSubmit} className="space-y-6 rounded-[2rem] border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur-xl">
          <div className="space-y-3 text-center">
            <h1 className="text-3xl font-semibold text-white">Admin Login</h1>
            <p className="text-sm text-slate-300">Use your admin username or email and password to access the portal.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Username or Email</label>
            <input
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-slate-700 bg-slate-950/40 px-4 py-3 text-white placeholder-slate-500 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
              type="text"
              placeholder="akshat or akshatvision7@gmail.com"
              required
            />
            <p className="text-xs text-slate-400 mt-2">Enter your admin username or email address.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Password</label>
            <input
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-slate-700 bg-slate-950/40 px-4 py-3 text-white placeholder-slate-500 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
              type="password"
              required
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            disabled={loading}
            className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}




