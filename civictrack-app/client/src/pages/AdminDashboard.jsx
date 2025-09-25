import { useEffect, useState } from 'react'
import { adminListComplaints, adminUpdateComplaint, adminDeleteComplaint } from '../lib/adminApi'
import { useAdminAuth } from '../context/AdminAuthContext'

const statuses = ['Pending', 'In Progress', 'Resolved']
const departments = ['Roads', 'Sanitation', 'Water', 'Electricity', 'Parks']

export default function AdminDashboard() {
  const { token, setToken } = useAdminAuth()
  const [items, setItems] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await adminListComplaints(token, { status: statusFilter, department: deptFilter })
      setItems(data)
    } catch (e) {
      setError('Failed to load complaints')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, deptFilter])

  const onUpdate = async (id, status, department) => {
    await adminUpdateComplaint(token, id, { status, department })
    await load()
  }

  const onReject = async (id) => {
    if (!confirm('Reject and delete this complaint? This cannot be undone.')) return
    await adminDeleteComplaint(token, id)
    await load()
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <button className="text-sm text-gray-600 underline" onClick={() => setToken('')}>Logout</button>
        </div>
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <select className="rounded border p-2" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="rounded border p-2" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
            <option value="">All Departments</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <button onClick={load} className="rounded bg-gray-900 px-4 py-2 font-semibold text-white">Refresh</button>
        </div>
        {loading && <p>Loading...</p>}
        {error && <p className="text-red-600">{error}</p>}
        <div className="overflow-x-auto rounded border bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="px-3 py-2">ID</th>
                <th className="px-3 py-2">Photo</th>
                <th className="px-3 py-2">Description</th>
                <th className="px-3 py-2">Location</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Department</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(row => (
                <tr key={row.id} className="border-t">
                  <td className="px-3 py-2">{row.id}</td>
                  <td className="px-3 py-2">
                    {row.photo_url && <img src={`http://localhost:3000${row.photo_url}`} className="h-10 w-10 rounded object-cover" />}
                  </td>
                  <td className="px-3 py-2 max-w-xs">{row.description}</td>
                  <td className="px-3 py-2 text-xs">{row.latitude}, {row.longitude}</td>
                  <td className="px-3 py-2">
                    <select className="rounded border p-1" value={row.status} onChange={e => onUpdate(row.id, e.target.value, row.department)}>
                      {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <select className="rounded border p-1" value={row.department || ''} onChange={e => onUpdate(row.id, row.status, e.target.value || null)}>
                      <option value="">Unassigned</option>
                      {departments.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2 flex gap-2">
                    <button className="rounded bg-blue-600 px-3 py-1 text-white" onClick={() => onUpdate(row.id, row.status, row.department)}>Save</button>
                    <button className="rounded bg-red-600 px-3 py-1 text-white" onClick={() => onReject(row.id)}>Reject</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}