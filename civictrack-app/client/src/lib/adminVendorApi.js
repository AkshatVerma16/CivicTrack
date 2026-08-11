// Admin API for vendor applications
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'

export async function adminListVendorApplications(token) {
  const res = await axios.get(`${API_BASE}/api/vendors/applications`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return res.data
}

export async function adminApproveVendorApplication(token, id) {
  const res = await axios.post(`${API_BASE}/api/vendors/applications/${id}/approve`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return res.data
}

export async function adminRejectVendorApplication(token, id) {
  const res = await axios.post(`${API_BASE}/api/vendors/applications/${id}/reject`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return res.data
}
