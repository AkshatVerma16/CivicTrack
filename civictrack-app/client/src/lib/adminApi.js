const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'

export async function adminLogin(identifier, password) {
  const res = await fetch(`${API_BASE}/api/auth/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  })
  if (!res.ok) {
    let errorMessage = 'Login failed'
    try {
      const errorData = await res.json()
      errorMessage = errorData.error || errorMessage
    } catch {
      // ignore parse errors
    }
    throw new Error(errorMessage)
  }
  return res.json()
}

export async function adminListComplaints(token, { status, department } = {}) {
  const url = new URL(`${API_BASE}/api/complaints`)
  if (status) url.searchParams.set('status', status)
  if (department) url.searchParams.set('department', department)
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to load complaints')
  return res.json()
}

export async function adminUpdateComplaint(token, id, { status, department }) {
  const res = await fetch(`${API_BASE}/api/complaints/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status, department }),
  })
  if (!res.ok) throw new Error('Failed to update complaint')
  return res.json()
}

export async function adminDeleteComplaint(token, id) {
  const res = await fetch(`${API_BASE}/api/complaints/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok && res.status !== 204) throw new Error('Failed to delete complaint')
  return true
}

export async function adminListMinistries(token) {
  const res = await fetch(`${API_BASE}/api/ministries`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to load ministries')
  return res.json()
}

export async function adminCreateMinistry(token, ministry) {
  const res = await fetch(`${API_BASE}/api/ministries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(ministry),
  })
  if (!res.ok) throw new Error('Failed to create ministry')
  return res.json()
}

export async function adminUpdateMinistry(token, id, ministry) {
  const res = await fetch(`${API_BASE}/api/ministries/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(ministry),
  })
  if (!res.ok) throw new Error('Failed to update ministry')
  return res.json()
}

export async function adminDeleteMinistry(token, id) {
  const res = await fetch(`${API_BASE}/api/ministries/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok && res.status !== 204) throw new Error('Failed to delete ministry')
  return true
}

export async function adminListUsers(token) {
  const res = await fetch(`${API_BASE}/api/users`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to load users')
  return res.json()
}

export async function adminDeleteUser(token, id) {
  const res = await fetch(`${API_BASE}/api/users/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok && res.status !== 204) throw new Error('Failed to delete user')
  return true
}

export async function adminListLogs(token) {
  const res = await fetch(`${API_BASE}/api/logs`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to load logs')
  return res.json()
}

export async function adminStats(token) {
  const res = await fetch(`${API_BASE}/api/admin/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to load stats')
  return res.json()
}