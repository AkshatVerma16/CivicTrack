import { Link, useNavigate } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'
import { useEffect } from 'react'

const roleCards = [
  {
    role: 'user',
    title: 'Citizen',
    href: '/login?role=user',
    icon: '👤',
    bg: 'bg-gradient-to-br from-sky-500 to-indigo-600',
    shadow: 'shadow-lg shadow-sky-300/50'
  },
  {
    role: 'ministry',
    title: 'Ministry',
    href: '/login?role=ministry',
    icon: '🏛️',
    bg: 'bg-gradient-to-br from-emerald-500 to-teal-600',
    shadow: 'shadow-lg shadow-emerald-300/50'
  },
  {
    role: 'vendor',
    title: 'Vendor',
    href: '/login?role=vendor',
    icon: '🛠️',
    bg: 'bg-gradient-to-br from-amber-500 to-orange-600',
    shadow: 'shadow-lg shadow-amber-300/50'
  },
  {
    role: 'admin',
    title: 'Admin',
    href: '/admin/login',
    icon: '⚙️',
    bg: 'bg-gradient-to-br from-violet-500 to-fuchsia-600',
    shadow: 'shadow-lg shadow-violet-300/50'
  },
]

export default function Home() {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  let userRole = null

  if (token) {
    try {
      const decoded = jwtDecode(token)
      userRole = decoded.role
    } catch (error) {
      console.warn('Invalid token, clearing localStorage:', error)
      localStorage.removeItem('token')
    }
  }

  // Temporarily disable auto-redirect to allow role selection
  // Uncomment the code below if you want auto-redirect back
  /*
  useEffect(() => {
    if (userRole) {
      if (userRole === 'admin') {
        navigate('/admin')
      } else if (userRole === 'ministry') {
        navigate('/ministry')
      } else if (userRole === 'vendor') {
        navigate('/vendor')
      } else {
        navigate('/user')
      }
    }
  }, [userRole, navigate])
  */

  const handleLogout = () => {
    localStorage.removeItem('token')
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-4xl font-bold text-white shadow-2xl mb-6">
            CT
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">CivicTrack</h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Select your role to continue
          </p>
        </div>

        {/* Role Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {roleCards.map(card => (
            <Link
              key={card.role}
              to={card.href}
              className={`
                group relative overflow-hidden rounded-2xl p-8
                transition-all duration-300 transform
                hover:scale-110 hover:-translate-y-2
                cursor-pointer
              `}
            >
              {/* Background */}
              <div className={`absolute inset-0 ${card.bg} ${card.shadow}`}></div>
              
              {/* Hover effect overlay */}
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              {/* Content */}
              <div className="relative z-10 flex flex-col items-center justify-center h-full min-h-60">
                <div className="text-6xl mb-6 group-hover:scale-125 transition-transform duration-300">
                  {card.icon}
                </div>
                <h3 className="text-2xl font-bold text-white text-center">
                  {card.title}
                </h3>
                <div className="mt-6 text-white/80 text-sm group-hover:text-white transition-colors">
                  Click to continue →
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Footer */}
        {token && (
          <div className="text-center">
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-6 py-3 rounded-full bg-rose-500 hover:bg-rose-600 text-white font-semibold transition-colors shadow-lg"
            >
              Logout
            </button>
          </div>
        )}

        {/* Info Section */}
        <div className="text-center text-slate-400 text-sm mt-12">
          <p>Select your role above to login or register</p>
          <p className="mt-2 text-xs">Registration is available only for Citizen role</p>
        </div>
      </div>
    </div>
  )
}






