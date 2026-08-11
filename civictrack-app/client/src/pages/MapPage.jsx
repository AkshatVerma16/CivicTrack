import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { Icon } from 'leaflet'
import { getActiveComplaints } from '../lib/api'
import 'leaflet/dist/leaflet.css'

// Fix for default markers in react-leaflet
delete Icon.Default.prototype._getIconUrl
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

const categoryColors = {
  Electricity: 'red',
  Water: 'blue',
  Roads: 'green',
  Sanitation: 'orange',
  Parks: 'purple',
  // Add more as needed
}

const createIcon = (color) => new Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

export default function MapPage() {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const data = await getActiveComplaints()
        setComplaints(data)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    fetchComplaints()
  }, [])

  if (loading) return <div className="p-6">Loading map...</div>
  if (error) return <div className="p-6 text-red-600">{error}</div>

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-bold mb-4">Active Complaints Map</h1>
        <div className="h-96 rounded-lg overflow-hidden shadow-sm">
          <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {complaints.map((complaint) => (
              <Marker
                key={complaint.id}
                position={[complaint.latitude, complaint.longitude]}
                icon={createIcon(categoryColors[complaint.department] || 'blue')}
              >
                <Popup>
                  <div className="max-w-xs">
                    <h3 className="font-semibold text-lg">{complaint.title}</h3>
                    {complaint.image_url && (
                      <img
                        src={`${import.meta.env.VITE_API_BASE || 'http://localhost:3000'}${complaint.image_url}`}
                        alt="Complaint"
                        className="w-full h-24 object-cover rounded mt-2"
                      />
                    )}
                    <p className="text-sm text-gray-600 mt-2">Status: {complaint.status}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
        <div className="mt-4 text-sm text-gray-600">
          Showing {complaints.length} active complaints with location data.
        </div>
      </div>
    </div>
  )
}