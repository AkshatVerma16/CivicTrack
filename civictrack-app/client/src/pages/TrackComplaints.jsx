import { useEffect, useState } from 'react'
import { getUserComplaints } from '../lib/api'
import StatusTag from '../components/StatusTag'

export default function TrackComplaints() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const userId = 1 // demo user id
    getUserComplaints(userId)
      .then(setItems)
      .catch(() => setError('Failed to load'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-6 text-2xl font-bold">Your Complaints</h1>
        {loading && <p>Loading...</p>}
        {error && <p className="text-red-600">{error}</p>}
        <ul className="space-y-4">
          {items.map(item => (
            <li key={item.id} className="rounded border bg-white p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                {item.photo_url && (
                  <img
                    src={`http://localhost:3000${item.photo_url}`}
                    alt=""
                    className="h-24 w-24 rounded object-cover"
                  />
                )}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <StatusTag status={item.status} />
                    <span className="text-xs text-gray-500">
                      {new Date(item.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-800">{item.description}</p>
                  {(item.latitude || item.longitude) && (
                    <div className="space-y-1">
                      <p className="text-xs text-gray-600">
                        📍 {item.latitude}, {item.longitude}
                      </p>
                      <div className="overflow-hidden rounded border">
                        <iframe
                          title={`map-${item.id}`}
                          src={`https://www.google.com/maps?q=${item.latitude || 0},${item.longitude || 0}&z=16&output=embed`}
                          className="h-40 w-full border-0"
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
        {items.length === 0 && !loading && (
          <p className="text-gray-600">No complaints yet.</p>
        )}
      </div>
    </div>
  )
}







