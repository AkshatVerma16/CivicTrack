const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'

export async function adminLogin(email, password) {
  const res = await fetch(`${API_BASE}/api/auth/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) throw new Error('Login failed')
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