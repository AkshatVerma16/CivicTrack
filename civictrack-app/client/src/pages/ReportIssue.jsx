import { useEffect, useState } from 'react'
import { submitComplaint } from '../lib/api'

export default function ReportIssue() {
  const [photo, setPhoto] = useState(null)
  const [description, setDescription] = useState('')
  const [coords, setCoords] = useState({ lat: '', lng: '' })
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      pos => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, timeout: 5000 }
    )
  }, [])

  const onSubmit = async e => {
    e.preventDefault()
    setSubmitting(true)
    setMessage('')
    try {
      if (!photo && !description.trim()) {
        setMessage('Add a photo or description')
        setSubmitting(false)
        return
      }
      const form = new FormData()
      // demo user id 1; in real app derive from auth/session
      form.append('user_id', '1')
      form.append('description', description)
      if (coords.lat) form.append('latitude', String(coords.lat))
      if (coords.lng) form.append('longitude', String(coords.lng))
      if (photo) form.append('photo', photo)
      const res = await submitComplaint(form)
      setMessage('Complaint submitted successfully!')
      setDescription('')
      setPhoto(null)
    } catch (e) {
      setMessage('Failed to submit. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-xl">
        <h1 className="mb-6 text-2xl font-bold">Report an Issue</h1>
        <form onSubmit={onSubmit} className="space-y-4 rounded-lg border bg-white p-6">
          <div>
            <label className="block text-sm font-medium">Photo (optional)</label>
            <input type="file" accept="image/*" onChange={e => setPhoto(e.target.files?.[0] || null)} className="mt-1 block w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} className="mt-1 block w-full rounded border p-2" rows={3} placeholder="Describe the issue..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Latitude</label>
              <input value={coords.lat} onChange={e => setCoords(c => ({ ...c, lat: e.target.value }))} className="mt-1 w-full rounded border p-2" placeholder="Auto" />
            </div>
            <div>
              <label className="block text-sm font-medium">Longitude</label>
              <input value={coords.lng} onChange={e => setCoords(c => ({ ...c, lng: e.target.value }))} className="mt-1 w-full rounded border p-2" placeholder="Auto" />
            </div>
          </div>
          <button disabled={submitting} className="rounded bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-50">{submitting ? 'Submitting...' : 'Submit'}</button>
          {message && <p className="text-sm text-gray-700">{message}</p>}
        </form>
      </div>
    </div>
  )
}


