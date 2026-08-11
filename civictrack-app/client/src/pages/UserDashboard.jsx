import { useState, useEffect, useRef } from 'react'
import { useAdminAuth } from '../context/AdminAuthContext.jsx'
import axios from 'axios'
import { FaRoad, FaWater, FaLeaf, FaGraduationCap, FaSearch, FaHome, FaCog, FaUser, FaPlus, FaList, FaMapMarkerAlt, FaSignOutAlt, FaBuilding, FaShoppingCart, FaTools, FaLightbulb, FaTree, FaHeartbeat, FaBook } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'

// Map icon identifiers to React icon components
const iconMap = {
  'road': FaRoad,
  'water': FaWater,
  'leaf': FaLeaf,
  'graduation-cap': FaGraduationCap,
  'building': FaBuilding,
  'shopping-cart': FaShoppingCart,
  'tools': FaTools,
  'lightbulb': FaLightbulb,
  'tree': FaTree,
  'heart': FaHeartbeat,
  'book': FaBook,
  'cog': FaCog,
}

// Official rectangular status tags
const statusColors = {
  'Pending': 'bg-govred text-white border border-govred',
  'In Progress': 'bg-yellow-100 text-yellow-900 border border-yellow-400',
  'Vendor Complete': 'bg-indigo-100 text-indigo-900 border border-indigo-400',
  'Complete': 'bg-green-100 text-green-900 border border-green-400',
  'Resolved': 'bg-green-100 text-green-900 border border-green-400',
  'Archived': 'bg-emerald-100 text-emerald-900 border border-emerald-400',
  'Withdrawn': 'bg-govgray text-white border border-govgray',
}

export default function UserDashboard() {
  const { token } = useAdminAuth();
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [user, setUser] = useState(null)
  const [complaints, setComplaints] = useState([])
  const [confirmingId, setConfirmingId] = useState(null)
  const [withdrawingId, setWithdrawingId] = useState(null)

  // Dashboard state
  const [ministries, setMinistries] = useState([])
  const [filteredMinistries, setFilteredMinistries] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMinistry, setSelectedMinistry] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({ title: '', description: '', photo: null })
  const [location, setLocation] = useState({ latitude: null, longitude: null })
  const [locationStatus, setLocationStatus] = useState('Location not detected yet.')
  const [photoPreview, setPhotoPreview] = useState(null)
  const [uploadAttempts, setUploadAttempts] = useState(0)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [trackView, setTrackView] = useState('active')

  // Profile state
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ 
    name: '', 
    password: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    government_id_type: '',
    government_id_number: '',
    profile_picture: null,
    government_id_image: null
  })
  const [profilePicturePreview, setProfilePicturePreview] = useState(null)
  const [govIdImagePreview, setGovIdImagePreview] = useState(null)
  const profilePictureInputRef = useRef(null)
  const govIdImageInputRef = useRef(null)

  useEffect(() => {
    fetchUserData()
    fetchMinistries()
  }, [])

  useEffect(() => {
    setFilteredMinistries(
      ministries.filter(ministry =>
        ministry.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
  }, [ministries, searchTerm])

  const fetchUserData = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUser(response.data)
      setEditForm({ 
        name: response.data.name, 
        password: '',
        email: response.data.email || '',
        phone: response.data.phone || '',
        address: response.data.address || '',
        city: response.data.city || '',
        state: response.data.state || '',
        postal_code: response.data.postal_code || '',
        government_id_type: response.data.government_id_type || '',
        government_id_number: response.data.government_id_number || '',
        profile_picture: null,
        government_id_image: null
      })
      if (response.data.profile_picture) {
        setProfilePicturePreview(`http://localhost:3000${response.data.profile_picture}`)
      }
      if (response.data.government_id_image_url) {
        setGovIdImagePreview(`http://localhost:3000${response.data.government_id_image_url}`)
      }

      // Fetch user complaints
      const complaintsResponse = await axios.get('http://localhost:3000/api/complaints/user', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setComplaints(complaintsResponse.data)
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
  }

  const fetchMinistries = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/ministries/public')
      setMinistries(response.data)
    } catch (error) {
      console.error('Error fetching ministries:', error)
    }
  }

  const getMinistryCounts = () => {
    return ministries.map((ministry) => {
      const ministryComplaints = complaints.filter(c => c.ministry_id === ministry.id)
      return {
        ...ministry,
        total: ministryComplaints.length,
        pending: ministryComplaints.filter(c => ['Pending', 'Open'].includes(c.status)).length,
        inProgress: ministryComplaints.filter(c => ['In Progress', 'Vendor Complete'].includes(c.status)).length,
        resolved: ministryComplaints.filter(c => ['Complete', 'Resolved', 'Archived'].includes(c.status)).length,
      }
    })
  }

  const handleMinistryClick = (ministry) => {
    setSelectedMinistry(ministry)
    setIsModalOpen(true)
  }

  useEffect(() => {
    if (isModalOpen) {
      handleDetectLocation()
    }
  }, [isModalOpen])

  const handleSubmitComplaint = async (e) => {
    e.preventDefault()
    if (!formData.title || !formData.description || !formData.photo) {
      alert('Please add a photo for your complaint before submitting.')
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('token')

      const formDataToSend = new FormData()
      formDataToSend.append('ministry_id', selectedMinistry.id)
      formDataToSend.append('title', formData.title)
      formDataToSend.append('description', formData.description)
      if (location.latitude && location.longitude) {
        formDataToSend.append('latitude', location.latitude)
        formDataToSend.append('longitude', location.longitude)
      }
      if (formData.photo) {
        formDataToSend.append('photo', formData.photo)
      }

      await axios.post('http://localhost:3000/api/complaints', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
        },
      })

      setIsModalOpen(false)
      setFormData({ title: '', description: '', photo: null })
      setLocation({ latitude: null, longitude: null })
      setLocationStatus('Location not detected yet.')
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview)
        setPhotoPreview(null)
      }
      alert('Complaint submitted successfully!')
      fetchUserData() // Refresh complaints
    } catch (error) {
      console.error('Error submitting complaint:', error)
      alert('Error submitting complaint')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmResolved = async (complaintId) => {
    setConfirmingId(complaintId)
    try {
      const token = localStorage.getItem('token')
      await axios.post(`http://localhost:3000/api/complaints/${complaintId}/confirm`, null, {
        headers: { Authorization: `Bearer ${token}` }
      })
      await fetchUserData()
      setTrackView('history')
      alert('Complaint confirmed resolved and moved to your history.')
    } catch (error) {
      console.error('Error confirming complaint:', error)
      alert('Unable to confirm the resolution. Please try again.')
    } finally {
      setConfirmingId(null)
    }
  }

  const handleWithdrawComplaint = async (complaintId) => {
    setWithdrawingId(complaintId)
    try {
      const token = localStorage.getItem('token')
      await axios.post(`http://localhost:3000/api/complaints/${complaintId}/withdraw`, null, {
        headers: { Authorization: `Bearer ${token}` }
      })
      await fetchUserData()
      setTrackView('history')
      alert('Complaint withdrawn and moved to your history.')
    } catch (error) {
      console.error('Error withdrawing complaint:', error)
      alert('Unable to withdraw the complaint. Please try again.')
    } finally {
      setWithdrawingId(null)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) {
      return
    }

    const isImage = file.type.startsWith('image/')
    const maxFileSize = 5 * 1024 * 1024 // 5MB
    if (!isImage) {
      const nextAttempts = uploadAttempts + 1
      setUploadAttempts(nextAttempts)
      setUploadError('Please select a valid image file.')
      if (nextAttempts >= 3) {
        setUploadError('Upload disabled after 3 failed attempts. Please refresh to try again.')
      }
      return
    }
    if (file.size > maxFileSize) {
      const nextAttempts = uploadAttempts + 1
      setUploadAttempts(nextAttempts)
      setUploadError('Image is too large. Choose a file under 5MB.')
      if (nextAttempts >= 3) {
        setUploadError('Upload disabled after 3 failed attempts. Please refresh to try again.')
      }
      return
    }

    const previewUrl = URL.createObjectURL(file)
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview)
    }
    setPhotoPreview(previewUrl)
    setFormData({ ...formData, photo: file })
    setUploadAttempts(0)
    setUploadError('')
  }

  const handleRemovePhoto = () => {
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview)
    }
    setPhotoPreview(null)
    setFormData({ ...formData, photo: null })
    setUploadError('')
  }

  const triggerFileUpload = () => {
    if (uploadAttempts >= 3) return
    fileInputRef.current?.click()
  }

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by your browser.')
      return
    }

    setLocationStatus('Detecting current location...')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
        setLocationStatus('Location detected successfully.')
      },
      (error) => {
        setLocationStatus('Unable to detect location. Please allow location access or try again.')
        console.error('Geolocation error:', error)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  const handleEditProfile = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      const formDataToSend = new FormData()
      
      // Always add these fields
      formDataToSend.append('name', editForm.name || '')
      formDataToSend.append('email', editForm.email || '')
      formDataToSend.append('phone', editForm.phone || '')
      formDataToSend.append('address', editForm.address || '')
      formDataToSend.append('city', editForm.city || '')
      formDataToSend.append('state', editForm.state || '')
      formDataToSend.append('postal_code', editForm.postal_code || '')
      formDataToSend.append('government_id_type', editForm.government_id_type || '')
      formDataToSend.append('government_id_number', editForm.government_id_number || '')
      if (editForm.password) {
        formDataToSend.append('password', editForm.password)
      }
      
      // Add file if selected
      if (editForm.profile_picture) {
        formDataToSend.append('profile_picture', editForm.profile_picture)
      }
      if (editForm.government_id_image) {
        formDataToSend.append('government_id_image', editForm.government_id_image)
      }

      const response = await axios.patch('http://localhost:3000/api/auth/update', formDataToSend, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      })

      // Update user state directly with response
      setUser(response.data)
      setEditing(false)
      alert('Profile updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      console.error('Response:', error.response?.data)
      alert('Error updating profile: ' + (error.response?.data?.error || error.message))
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/')
  }

  const renderDashboard = () => {
    const ministryCounts = getMinistryCounts()
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome back, {user?.name}!</h1>
          <p className="text-gray-600">Manage your complaints and civic issues</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <FaList className="text-3xl text-blue-600 mr-4" />
              <div>
                <p className="text-2xl font-bold text-gray-800">{complaints.length}</p>
                <p className="text-gray-600">Total Complaints</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <FaMapMarkerAlt className="text-3xl text-yellow-500 mr-4" />
              <div>
                <p className="text-2xl font-bold text-gray-800">
                  {complaints.filter(c => ['Pending', 'Open'].includes(c.status)).length}
                </p>
                <p className="text-gray-600">Pending / Open</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <FaCog className="text-3xl text-blue-500 mr-4" />
              <div>
                <p className="text-2xl font-bold text-gray-800">
                  {complaints.filter(c => ['In Progress', 'Vendor Complete'].includes(c.status)).length}
                </p>
                <p className="text-gray-600">In Progress</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <FaHome className="text-3xl text-green-500 mr-4" />
              <div>
                <p className="text-2xl font-bold text-gray-800">
                  {complaints.filter(c => ['Complete', 'Resolved', 'Archived'].includes(c.status)).length}
                </p>
                <p className="text-gray-600">Resolved / Complete</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 max-h-[420px] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Ministry Overview</h2>
            <div className="space-y-4">
              {ministryCounts.length === 0 ? (
                <p className="text-gray-600">No ministries available yet.</p>
              ) : (
                ministryCounts.map((ministry) => (
                  <div key={ministry.id} className="rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">{ministry.name}</h3>
                        <p className="text-sm text-gray-500">{ministry.total} complaints</p>
                      </div>
                      <div className="text-right text-sm text-gray-600">
                        <p>Pending {ministry.pending}</p>
                        <p>In Progress {ministry.inProgress}</p>
                        <p>Resolved {ministry.resolved}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 max-h-[420px] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Latest Complaint Problems</h2>
            {complaints.length === 0 ? (
              <p className="text-gray-600">No complaints have been submitted yet.</p>
            ) : (
              <div className="space-y-4">
                {complaints.slice(0, 5).map((complaint) => (
                  <div key={complaint.id} className="rounded-xl border border-gray-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-gray-800">{complaint.title}</h3>
                        <p className="text-sm text-gray-600">{complaint.description.substring(0, 80)}...</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold border ${statusColors[complaint.status]} rounded-none`}>
                        {complaint.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">{complaint.ministry_name || 'Unknown Ministry'} • {new Date(complaint.created_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const renderSubmitComplaint = () => (
    <div className="p-6 overflow-y-auto h-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Submit a Complaint</h1>
        <p className="text-gray-600">Select a ministry and submit your complaint</p>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="relative">
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search ministries..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Ministries Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMinistries.map((ministry) => {
          const IconComponent = ministry.icon_identifier ? iconMap[ministry.icon_identifier] || FaCog : FaCog
          return (
            <div
              key={ministry.id}
              className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleMinistryClick(ministry)}
            >
              <div className="flex items-center mb-4">
                <IconComponent className="text-3xl text-blue-500 mr-3" />
                <h3 className="text-xl font-semibold text-gray-800">{ministry.name}</h3>
              </div>
              <p className="text-gray-600">Click to submit a complaint</p>
            </div>
          )
        })}
      </div>
    </div>
  )

  const renderTrackComplaints = () => {
    const activeComplaints = complaints.filter(c => !['Archived', 'Withdrawn', 'Rejected (Acknowledged)', 'Warned (Acknowledged)'].includes(c.status))
    const historyComplaints = complaints.filter(c => ['Archived', 'Withdrawn', 'Rejected (Acknowledged)', 'Warned (Acknowledged)'].includes(c.status))

    return (
      <div className="p-6 overflow-y-auto h-full">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Track Your Complaints</h1>
          <p className="text-gray-600">Monitor the status of all your submitted complaints</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <p className="text-sm text-gray-500">Active complaints</p>
            <p className="text-3xl font-bold text-gray-900 mt-3">{activeComplaints.length}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <button
            type="button"
            onClick={() => setTrackView('active')}
            className={`px-4 py-2 rounded-full text-sm font-semibold ${trackView === 'active' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Active
          </button>
          <button
            type="button"
            onClick={() => setTrackView('history')}
            className={`px-4 py-2 rounded-full text-sm font-semibold ${trackView === 'history' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            History
          </button>
        </div>

        {complaints.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <FaList className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No complaints yet</h3>
            <p className="text-gray-500">Submit your first complaint to get started!</p>
          </div>
        ) : (
          <>
            {trackView === 'active' && (
              <div className="space-y-6">
                {activeComplaints.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-md p-6 text-center">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">No active complaints</h3>
                    <p className="text-gray-600">All resolved complaints have moved to history.</p>
                  </div>
                ) : (
                  activeComplaints.map((complaint) => (
                    <div key={complaint.id} className="bg-white rounded-lg shadow-md p-6">
                      <div className="flex items-start justify-between mb-4 gap-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-800 mb-2">{complaint.title}</h3>
                          <p className="text-gray-600 mb-3">{complaint.description}</p>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                            <span>📅 {new Date(complaint.created_at).toLocaleDateString()}</span>
                            <span>🏛️ {complaint.ministry_name || 'Unknown Ministry'}</span>
                          </div>
                        </div>
                        <span className={`px-3 py-1 text-sm font-semibold border ${statusColors[complaint.status]} rounded-none`}>
                          {complaint.status}
                        </span>
                      </div>

                      {complaint.image_url && (
                        <div className="mb-4">
                          <img
                            src={`http://localhost:3000${complaint.image_url}`}
                            alt="Complaint"
                            className="w-full max-w-md h-48 object-cover rounded-lg"
                          />
                        </div>
                      )}

                      {(complaint.latitude || complaint.longitude) && (
                        <div className="border-t pt-4">
                          <p className="text-sm text-gray-600 mb-2">📍 Location: {complaint.latitude}, {complaint.longitude}</p>
                          <div className="rounded-lg overflow-hidden border">
                            <iframe
                              title={`map-${complaint.id}`}
                              src={`https://www.google.com/maps?q=${complaint.latitude || 0},${complaint.longitude || 0}&z=16&output=embed`}
                              className="w-full h-40 border-0"
                              loading="lazy"
                              referrerPolicy="no-referrer-when-downgrade"
                            />
                          </div>
                        </div>
                      )}

                      <div className="mt-4 flex flex-wrap justify-end gap-3">
                        {['Complete', 'Resolved'].includes(complaint.status) && !complaint.confirmed_at && (
                          <button
                            type="button"
                            onClick={() => handleConfirmResolved(complaint.id)}
                            disabled={confirmingId === complaint.id}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                          >
                            {confirmingId === complaint.id ? 'Confirming...' : 'Confirm Resolved'}
                          </button>
                        )}
                        {['Pending', 'Open', 'In Progress'].includes(complaint.status) && (
                          <button
                            type="button"
                            onClick={() => handleWithdrawComplaint(complaint.id)}
                            disabled={withdrawingId === complaint.id}
                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                          >
                            {withdrawingId === complaint.id ? 'Withdrawing...' : 'Withdraw Complaint'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {trackView === 'history' && (
              <div className="space-y-4">
                {historyComplaints.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-md p-6 text-center">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">No history yet</h3>
                    <p className="text-gray-600">Confirmed resolved complaints will appear here.</p>
                  </div>
                ) : (
                  historyComplaints.map((complaint) => (
                    <div key={complaint.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">{complaint.title}</h3>
                          <p className="text-gray-600 text-sm mt-1">{complaint.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">
                            {complaint.status === 'Withdrawn' ? 'Withdrawn on' : 
                             complaint.status === 'Archived' ? 'Resolved on' : 'Updated on'}
                          </p>
                          <p className="text-base font-semibold text-gray-800">{new Date(complaint.confirmed_at || complaint.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
                        <span>🏛️ {complaint.ministry_name || 'Unknown Ministry'}</span>
                        <span className={`px-3 py-1 font-semibold border ${statusColors[complaint.status]} rounded-none`}>
                          {complaint.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  const renderProfile = () => (
    <div className="p-6 overflow-y-auto h-full">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-800">My Profile</h1>
            <button
              onClick={() => setEditing(!editing)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {editing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          {editing ? (
            <form onSubmit={handleEditProfile} className="space-y-6">
              {/* Profile Picture */}
              <div className="border-b pb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Profile Picture</label>
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 bg-gray-200 rounded-full overflow-hidden flex items-center justify-center">
                    {profilePicturePreview ? (
                      <img src={profilePicturePreview} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl text-gray-400">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => profilePictureInputRef.current?.click()}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Upload Picture
                  </button>
                  <input
                    ref={profilePictureInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files[0]
                      if (file) {
                        setEditForm({ ...editForm, profile_picture: file })
                        setProfilePicturePreview(URL.createObjectURL(file))
                      }
                    }}
                  />
                </div>
              </div>

              {/* Personal Information */}
              <div className="border-b pb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Personal Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      placeholder="+91 XXXXX XXXXX"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                    <input
                      type="password"
                      value={editForm.password}
                      onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                      placeholder="Leave blank to keep current"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="border-b pb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Address Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <textarea
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      placeholder="Street address, building, etc."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows="2"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      <input
                        type="text"
                        value={editForm.city}
                        onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                      <input
                        type="text"
                        value={editForm.state}
                        onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                      <input
                        type="text"
                        value={editForm.postal_code}
                        onChange={(e) => setEditForm({ ...editForm, postal_code: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Government ID */}
              <div className="border-b pb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Government Identification</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ID Type</label>
                      <select
                        value={editForm.government_id_type}
                        onChange={(e) => setEditForm({ ...editForm, government_id_type: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select ID Type</option>
                        <option value="aadhar">Aadhar Card</option>
                        <option value="pan">PAN Card</option>
                        <option value="driving_licence">Driving License</option>
                        <option value="passport">Passport</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ID Number</label>
                      <input
                        type="text"
                        value={editForm.government_id_number}
                        onChange={(e) => setEditForm({ ...editForm, government_id_number: e.target.value })}
                        placeholder="Your legal ID number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ID Document Image</label>
                    <div className="flex items-center gap-4">
                      {govIdImagePreview && (
                        <div className="w-32 h-20 bg-gray-300 rounded border flex items-center justify-center overflow-hidden">
                          <img src={govIdImagePreview} alt="ID Document" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => govIdImageInputRef.current?.click()}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                      >
                        Upload Document
                      </button>
                      <input
                        ref={govIdImageInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files[0]
                          if (file) {
                            setEditForm({ ...editForm, government_id_image: file })
                            setGovIdImagePreview(URL.createObjectURL(file))
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Profile Picture Display */}
              <div className="text-center pb-6 border-b">
                <div className="w-32 h-32 bg-gray-200 rounded-full overflow-hidden flex items-center justify-center mx-auto mb-4">
                  {profilePicturePreview ? (
                    <img src={profilePicturePreview} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-6xl text-gray-400">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                  )}
                </div>
              </div>

              {/* Personal Information */}
              <div className="border-b pb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Personal Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <p className="text-lg text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{user?.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <p className="text-lg text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{user?.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <p className="text-lg text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{user?.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <p className="text-lg text-gray-900 bg-gray-50 px-3 py-2 rounded-lg capitalize">{user?.role}</p>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              {(user?.address || user?.city || user?.state) && (
                <div className="border-b pb-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Address Information</h2>
                  <div className="space-y-3">
                    {user?.address && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                        <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{user?.address}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {user?.city && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                          <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{user?.city}</p>
                        </div>
                      )}
                      {user?.state && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                          <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{user?.state}</p>
                        </div>
                      )}
                      {user?.postal_code && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                          <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{user?.postal_code}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Government ID */}
              {(user?.government_id_type || user?.government_id_number) && (
                <div className="border-b pb-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Government Identification</h2>
                  <div className="space-y-3">
                    {user?.government_id_type && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ID Type</label>
                        <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg capitalize">{user?.government_id_type?.replace('_', ' ')}</p>
                      </div>
                    )}
                    {user?.government_id_number && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ID Number</label>
                        <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{user?.government_id_number}</p>
                      </div>
                    )}
                    {govIdImagePreview && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">ID Document</label>
                        <img src={govIdImagePreview} alt="ID Document" className="w-48 h-32 object-cover rounded-lg border" />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen font-sans bg-govoffwhite">
      {/* Sidebar */}
      <div className="w-64 bg-govblue shadow-lg flex flex-col">
        {/* Branding: Logo and Seal */}
        <div className="flex flex-col items-center py-8 border-b border-blue-900">
          <span className="text-lg font-bold text-white tracking-wide">CivicTrack</span>
          <span className="text-xs text-blue-100">Government Portal</span>
        </div>
        <div className="p-6 flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center text-govblue font-bold text-lg overflow-hidden border-2 border-white">
            {user?.profile_picture ? (
              <img
                src={`http://localhost:3000${user.profile_picture}`}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              user?.name?.charAt(0)?.toUpperCase() || 'U'
            )}
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">{user?.name}</h2>
            <p className="text-xs text-blue-100">{user?.email}</p>
          </div>
        </div>
        <nav className="mt-2 flex-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center px-6 py-3 text-left transition-colors font-medium ${
              activeTab === 'dashboard' ? 'bg-blue-900 text-white border-r-4 border-white' : 'text-blue-100 hover:bg-blue-800'
            }`}
          >
            <FaHome className="mr-3" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('submit')}
            className={`w-full flex items-center px-6 py-3 text-left transition-colors font-medium ${
              activeTab === 'submit' ? 'bg-blue-900 text-white border-r-4 border-white' : 'text-blue-100 hover:bg-blue-800'
            }`}
          >
            <FaPlus className="mr-3" />
            Submit Complaint
          </button>
          <button
            onClick={() => setActiveTab('track')}
            className={`w-full flex items-center px-6 py-3 text-left transition-colors font-medium ${
              activeTab === 'track' ? 'bg-blue-900 text-white border-r-4 border-white' : 'text-blue-100 hover:bg-blue-800'
            }`}
          >
            <FaList className="mr-3" />
            Track Complaints
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center px-6 py-3 text-left transition-colors font-medium ${
              activeTab === 'profile' ? 'bg-blue-900 text-white border-r-4 border-white' : 'text-blue-100 hover:bg-blue-800'
            }`}
          >
            <FaUser className="mr-3" />
            Profile
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-6 py-3 text-left text-red-200 hover:bg-red-700 hover:text-white transition-colors mt-8 font-medium"
          >
            <FaSignOutAlt className="mr-3" />
            Logout
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-govoffwhite" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'submit' && renderSubmitComplaint()}
        {activeTab === 'track' && renderTrackComplaints()}
        {activeTab === 'profile' && renderProfile()}
      </div>

      {/* Complaint Submission Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-35 flex items-center justify-center z-50 p-3">
          <div className="bg-white rounded-xl p-4 w-full max-w-[320px] mx-1 shadow-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-3">Submit Complaint</h2>
            <p className="mb-4 text-gray-600">Ministry: <span className="font-semibold">{selectedMinistry?.name}</span></p>
            <form onSubmit={handleSubmitComplaint}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2 font-medium">Title *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Brief title for your complaint"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2 font-medium">Description *</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="4"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed description of the issue..."
                  required
                />
              </div>
                        <div className="mb-4">
                <label className="block text-gray-700 mb-2 font-medium">Photo *</label>
                <div
                  className="w-full h-32 border-2 border-dashed border-blue-200 rounded-2xl bg-blue-50 hover:border-blue-300 hover:bg-blue-100 transition-colors flex items-center justify-center cursor-pointer overflow-hidden mb-3"
                  onClick={triggerFileUpload}
                >
                  {photoPreview ? (
                    <div className="relative w-full h-full">
                      <img src={photoPreview} alt="Preview" className="object-cover w-full h-full" />
                      <div className="absolute inset-0 bg-black/20 flex items-end justify-end p-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRemovePhoto()
                          }}
                          className="px-3 py-1 text-sm bg-white bg-opacity-90 rounded-full text-gray-800 hover:bg-opacity-100"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-600 px-4">
                      <p className="font-semibold text-base">Click to upload an image</p>
                      <p className="text-sm mt-1">Select from device or use your camera.</p>
                      <p className="text-xs text-gray-500 mt-2">Recommended: clear photo, max 5MB.</p>
                    </div>
                  )}
                </div>
                {photoPreview && (
                  <div className="mt-3 text-sm text-gray-700 text-center">
                    <p className="font-medium">Selected file:</p>
                    <p>{formData.photo?.name}</p>
                    <p className="text-gray-500">{(formData.photo?.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                )}
                {uploadError && (
                  <p className="mt-2 text-sm text-red-600">{uploadError}</p>
                )}
                {uploadAttempts > 0 && uploadAttempts < 3 && (
                  <p className="mt-2 text-sm text-gray-600">Failed upload attempts: {uploadAttempts} / 3</p>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-gray-700 font-medium">Current Location</label>
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Detect Location
                  </button>
                </div>
                <div className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-sm text-gray-600">
                  {location.latitude && location.longitude ? (
                    <div>
                      <p>Latitude: {location.latitude.toFixed(6)}</p>
                      <p>Longitude: {location.longitude.toFixed(6)}</p>
                    </div>
                  ) : (
                    <p>{locationStatus}</p>
                  )}
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={() => {
                    setIsModalOpen(false)
                    setLocation({ latitude: null, longitude: null })
                    setLocationStatus('Location not detected yet.')
                    if (photoPreview) {
                      URL.revokeObjectURL(photoPreview)
                      setPhotoPreview(null)
                    }
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
                  disabled={!formData.photo || !formData.title || !formData.description || loading}
                >
                  {loading ? 'Submitting...' : 'Submit Complaint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}