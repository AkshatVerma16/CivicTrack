import { useEffect, useState } from 'react'
import { getCurrentUser, getUserComplaints, updateUserProfile } from '../lib/api'

const statusColors = {
  Pending: 'bg-gray-500',
  'In Progress': 'bg-blue-500',
  Complete: 'bg-green-500',
}

export default function ProfilePage() {
  const [user, setUser] = useState(null)
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', password: '' })

  const token = localStorage.getItem('token') // Assuming token is stored here

  useEffect(() => {
    if (!token) {
      setError('Not authenticated')
      setLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        const userData = await getCurrentUser(token)
        setUser(userData)
        setEditForm({ name: userData.name, password: '' })

        const complaintsData = await getUserComplaints(userData.id)
        setComplaints(complaintsData)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [token])

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    try {
      const updates = {}
      if (editForm.name !== user.name) updates.name = editForm.name
      if (editForm.password) updates.password = editForm.password

      const updatedUser = await updateUserProfile(token, updates)
      setUser(updatedUser)
      setEditing(false)
      setEditForm({ name: updatedUser.name, password: '' })
    } catch (e) {
      setError(e.message)
    }
  }

  if (loading) return <div className="p-6">Loading...</div>
  if (error) return <div className="p-6 text-red-600">{error}</div>
  if (!user) return <div className="p-6">User not found</div>

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">My Profile</h1>
            <button
              onClick={() => setEditing(!editing)}
              className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              {editing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          {editing ? (
            <form onSubmit={handleEditSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="mt-1 w-full rounded border p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">New Password (leave blank to keep current)</label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  className="mt-1 w-full rounded border p-2"
                />
              </div>
              <button type="submit" className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700">
                Save Changes
              </button>
            </form>
          ) : (
            <div className="mt-4 space-y-2">
              <p><strong>Name:</strong> {user.name}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Role:</strong> {user.role}</p>
            </div>
          )}
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">My Activity</h2>
          {complaints.length === 0 ? (
            <p>No complaints submitted yet.</p>
          ) : (
            <div className="space-y-4">
              {complaints.map((complaint) => (
                <div key={complaint.id} className="rounded border p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{complaint.title}</h3>
                    <span className={`rounded px-2 py-1 text-xs text-white ${statusColors[complaint.status] || 'bg-gray-500'}`}>
                      {complaint.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{complaint.description}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Submitted on {new Date(complaint.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}