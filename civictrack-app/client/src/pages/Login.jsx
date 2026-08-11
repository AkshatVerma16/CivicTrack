import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAdminAuth } from '../context/AdminAuthContext.jsx'
import { useNavigate, useLocation } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'

export default function Login() {
  const { setToken } = useAdminAuth();
  const [firstName, setFirstName] = useState('')
  const [middleName, setMiddleName] = useState('')
  const [lastName, setLastName] = useState('')
  const [identifier, setIdentifier] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isRegister, setIsRegister] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const selectedRole = new URLSearchParams(location.search).get('role') || 'user'
  const roleLabel = selectedRole === 'admin' ? 'Admin' : 
                   selectedRole === 'ministry' ? 'Ministry' :
                   selectedRole === 'vendor' ? 'Vendor' : 'Citizen'

  // Disable registration for non-user roles
  useEffect(() => {
    if (isRegister && selectedRole !== 'user') {
      setError('Registration is only available for Citizen role')
      setIsRegister(false)
    }
  }, [selectedRole, isRegister])

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const passwordPolicy = value => {
    if (value.length < 8) return 'Password must be at least 8 characters long.'
    if (!/[A-Z]/.test(value)) return 'Password must include at least one uppercase letter.'
    if (!/[0-9]/.test(value)) return 'Password must include at least one digit.'
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) return 'Password must include at least one special character.'
    return ''
  }

  const redirectToRole = (userRole) => {
    setLoading(false)
    setTimeout(() => {
      if (userRole === 'admin') {
        navigate('/admin')
      } else if (userRole === 'ministry') {
        navigate('/ministry')
      } else if (userRole === 'vendor') {
        navigate('/vendor')
      } else {
        navigate('/user')
      }
    }, 300)
  }

  const onSubmit = async e => {
    e.preventDefault()

    setLoading(true)
    setError('')

    if ((!isRegister && !identifier.trim()) || (isRegister && !email.trim()) || !password) {
      setError('Email/username and password are required')
      setLoading(false)
      return
    }

    if (isRegister) {
      if (selectedRole !== 'user') {
        setError('Registration is only available for Citizen users.');
        setLoading(false);
        return;
      }

      if (!firstName.trim() || !lastName.trim()) {
        setError('First name and last name are required');
        setLoading(false);
        return;
      }

      if (!emailRegex.test(email.trim())) {
        setError('Enter a valid email address');
        setLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }

      const passwordError = passwordPolicy(password);
      if (passwordError) {
        setError(passwordError);
        setLoading(false);
        return;
      }
    }

    try {
      if (isRegister) {
        // Register new user
        await axios.post(`${API_BASE}/api/auth/register`, {
          first_name: firstName.trim(),
          middle_name: middleName.trim(),
          last_name: lastName.trim(),
          email: email.trim().toLowerCase(),
          password,
        })

        // Auto login after register
        const loginResponse = await axios.post(`${API_BASE}/api/auth/login`, {
          identifier: email.trim().toLowerCase(),
          password,
        })

        const token = loginResponse.data.token
        setToken(token)
        
        setError('')
        redirectToRole('user')
      } else {
        // Login
        try {
          const response = await axios.post(`${API_BASE}/api/auth/login`, {
            identifier: identifier.trim(),
            password,
          })

          const { token } = response.data
          setToken(token)

          const payload = JSON.parse(atob(token.split('.')[1]))
          const userRole = payload.role

          setError('')
          redirectToRole(userRole)
        } catch (e) {
          // Check if vendor is pending approval
          if (selectedRole === 'vendor') {
            // Try to check vendor_applications for pending status
            try {
              const res = await axios.get(`${API_BASE}/api/vendors/applications`, { params: { email: identifier.trim() } })
              const pending = Array.isArray(res.data) && res.data.find(app => app.email === identifier.trim() && app.status === 'Pending')
              if (pending) {
                setError('Your account is pending admin approval.')
                setLoading(false)
                return
              }
            } catch {}
          }
          throw e
        }
      }
    } catch (e) {
      // Log the actual error for debugging
      if (e.response) {
        console.log('Login error response:', e.response.data)
      } else {
        console.log('Login error:', e)
      }
      if (isRegister && e.response?.status === 409) {
        setError('Email already registered. Please try login.')
      } else {
        const message = e.response?.data?.error || 'An error occurred. Please try again.'
        setError(message)
      }
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Back to Home Button */}
        <button
          onClick={() => navigate('/')}
          className="mb-8 flex items-center text-slate-300 hover:text-white transition-colors text-sm"
        >
          ← Back to Home
        </button>

        {/* Form Container */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-2xl font-bold text-white mb-4">
              CT
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">CivicTrack</h1>
            <p className="text-slate-300 text-sm">
              {isRegister ? 'Create your Citizen account' : `${roleLabel} Login`}
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-6">
            {isRegister && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">First Name *</label>
                    <input
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                      type="text"
                      placeholder="John"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Last Name *</label>
                    <input
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                      type="text"
                      placeholder="Doe"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Middle Name (Optional)</label>
                  <input
                    value={middleName}
                    onChange={e => setMiddleName(e.target.value)}
                    className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                    type="text"
                    placeholder="Quincy"
                  />
                </div>
              </div>
            )}

            {isRegister ? (
              <div>
                <label className="block text-sm font-medium text-white mb-2">Email Address *</label>
                <input
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                  type="email"
                  placeholder="you@example.com"
                  required
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-white mb-2">Username or Email *</label>
                <input
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                  type="text"
                  placeholder="you@example.com or username"
                  required
                />
                <p className="text-xs text-slate-400 mt-2">Use your email address or username to login.</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-white mb-2">Password *</label>
              <input
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                type="password"
                placeholder={isRegister ? "Min 8 chars, 1 uppercase, 1 number, 1 special" : "Enter password"}
                required
              />
            </div>

            {isRegister && (
              <div>
                <label className="block text-sm font-medium text-white mb-2">Confirm Password *</label>
                <input
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                  type="password"
                  placeholder="Confirm password"
                  required
                />
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="rounded-lg bg-rose-500/20 border border-rose-500/50 p-3 text-sm text-rose-200">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || (isRegister && selectedRole !== 'user')}
              className="w-full rounded-lg bg-gradient-to-r from-sky-500 to-indigo-600 px-4 py-3 font-semibold text-white shadow-lg shadow-sky-500/25 hover:shadow-lg hover:shadow-sky-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 mt-6"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                  {isRegister ? 'Creating account...' : 'Signing in...'}
                </span>
              ) : isRegister ? 'Create Account' : 'Sign In'}
            </button>

            {/* Registration link for Vendor */}
            {selectedRole === 'vendor' && !isRegister && (
              <div className="mt-4 text-center border-t border-white/10 pt-4">
                <a href="/vendor/register" className="text-sky-400 hover:text-sky-300 font-medium text-sm">Register as Vendor</a>
              </div>
            )}

            {/* Toggle Register/Login */}
            {selectedRole === 'user' && (
              <div className="text-center pt-4 border-t border-white/10">
                <p className="text-slate-300 text-sm mb-3">
                  {isRegister ? 'Already have an account?' : 'New to CivicTrack?'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(!isRegister)
                    setError('')
                    setIdentifier('')
                    setFirstName('')
                    setLastName('')
                    setMiddleName('')
                    setEmail('')
                    setPassword('')
                    setConfirmPassword('')
                  }}
                  className="text-sky-400 hover:text-sky-300 font-semibold transition-colors"
                >
                  {isRegister ? 'Login instead' : 'Register now'}
                </button>
              </div>
            )}

            {/* Info Message for Non-User Roles */}
            {selectedRole !== 'user' && selectedRole !== 'vendor' && (
              <p className="text-slate-400 text-xs text-center pt-4 border-t border-white/10">
                Only administrators can create {roleLabel.toLowerCase()} accounts
              </p>
            )}
          </form>
        </div>

        {/* Footer Note */}
        <p className="text-center text-slate-400 text-xs mt-8">
          {isRegister 
            ? 'Your data is secure and encrypted'
            : 'By logging in, you agree to our terms of service'
          }
        </p>
      </div>
    </div>
  )
}
