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







