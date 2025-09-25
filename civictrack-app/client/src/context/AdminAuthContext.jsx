import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const AdminAuthContext = createContext(null)

export function AdminAuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('admin_token') || '')

  useEffect(() => {
    if (token) localStorage.setItem('admin_token', token)
    else localStorage.removeItem('admin_token')
  }, [token])

  const value = useMemo(() => ({ token, setToken, isAuthed: Boolean(token) }), [token])
  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider')
  return ctx
}







