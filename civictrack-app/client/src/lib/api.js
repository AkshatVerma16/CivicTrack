const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'

export async function submitComplaint(formData) {
  const res = await fetch(`${API_BASE}/api/complaints`, {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) throw new Error('Failed to submit complaint')
  return res.json()
}

export async function getUserComplaints(userId) {
  const res = await fetch(`${API_BASE}/api/complaints/user/${userId}`)
  if (!res.ok) throw new Error('Failed to fetch complaints')
  return res.json()
}

export async function getUserNotifications(token) {
  const res = await fetch(`${API_BASE}/api/notifications`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to fetch notifications')
  return res.json()
}

export async function getCurrentUser(token) {
  const res = await fetch(`${API_BASE}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to fetch user details')
  return res.json()
}

export async function updateUserProfile(token, updates) {
  const res = await fetch(`${API_BASE}/api/auth/update`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  })
  if (!res.ok) throw new Error('Failed to update profile')
  return res.json()
}

export async function getActiveComplaints() {
  const res = await fetch(`${API_BASE}/api/complaints/active`)
  if (!res.ok) throw new Error('Failed to fetch active complaints')
  return res.json()
}







