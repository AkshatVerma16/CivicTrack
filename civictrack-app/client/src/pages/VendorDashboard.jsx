import { useState, useEffect, useRef } from 'react'
import { useAdminAuth } from '../context/AdminAuthContext.jsx'
import axios from 'axios'
import { FaTools, FaCheckCircle, FaClock, FaGavel, FaList, FaTasks, FaSignOutAlt, FaCamera, FaUpload, FaHistory, FaImage, FaUser, FaBuilding } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'

const API = 'http://localhost:3000'

export default function VendorDashboard() {
  const { token, setToken } = useAdminAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('bid')
  const [tasks, setTasks] = useState([])
  const [openComplaints, setOpenComplaints] = useState([])
  const [myBids, setMyBids] = useState([])
  const [historyBids, setHistoryBids] = useState([])
  const [loading, setLoading] = useState(false)
  const [updatingTaskId, setUpdatingTaskId] = useState(null)

  // Bid form state
  const [bidComplaintId, setBidComplaintId] = useState(null)
  const [bidBudget, setBidBudget] = useState('')
  const [bidDays, setBidDays] = useState('')
  const [bidLoading, setBidLoading] = useState(false)
  const [bidError, setBidError] = useState('')
  const [bidSuccess, setBidSuccess] = useState('')

  // Mark complete state
  const [completingTaskId, setCompletingTaskId] = useState(null)
  const [completionFile, setCompletionFile] = useState(null)
  const [completionPreview, setCompletionPreview] = useState(null)
  const completionFileRef = useRef(null)

  // Progress photo state
  const [uploadingProgressId, setUploadingProgressId] = useState(null)
  const [taskSuccess, setTaskSuccess] = useState('')
  const progressFileRef = useRef(null)

  const [bankDetails, setBankDetails] = useState({ bank_name: '', account_number: '', ifsc_code: '' })
  const [bankMessage, setBankMessage] = useState('')

  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    if (activeTab === 'bid') fetchOpenComplaints()
    if (activeTab === 'mybids') fetchMyBids()
    if (activeTab === 'tasks') fetchTasks()
    if (activeTab === 'history') { fetchTasks(); fetchAuditLogs(); }
    if (activeTab === 'profile') fetchBankDetails()
  }, [activeTab])

  const fetchBankDetails = async () => {
    try {
      const res = await axios.get(`${API}/api/vendors/me/bank`, { headers })
      if (res.data) setBankDetails({
        bank_name: res.data.bank_name || '',
        account_number: res.data.account_number || '',
        ifsc_code: res.data.ifsc_code || ''
      })
    } catch (e) { console.error(e) }
  }

  const saveBankDetails = async (e) => {
    e.preventDefault()
    setBankMessage('')
    try {
      await axios.patch(`${API}/api/vendors/me/bank`, bankDetails, { headers })
      setBankMessage('Bank details saved successfully!')
      setTimeout(() => setBankMessage(''), 3000)
    } catch (e) {
      setBankMessage(e.response?.data?.error || 'Failed to save details')
    }
  }

  const fetchOpenComplaints = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${API}/api/bids/open/complaints`, { headers })
      setOpenComplaints(res.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const fetchMyBids = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${API}/api/bids/my/all`, { headers })
      setMyBids(res.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const fetchAuditLogs = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${API}/api/bids/my/audit-logs`, { headers })
      setHistoryBids(res.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const fetchTasks = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${API}/api/tasks/vendor/tasks`, { headers })
      setTasks(res.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const submitBid = async (e) => {
    e.preventDefault()
    setBidLoading(true)
    setBidError('')
    setBidSuccess('')
    try {
      await axios.post(`${API}/api/bids`, {
        complaint_id: bidComplaintId,
        estimated_time: Number(bidDays),
        budget: Number(bidBudget),
      }, { headers })
      setBidSuccess('Bid submitted successfully!')
      setBidBudget('')
      setBidDays('')
      setBidComplaintId(null)
      fetchOpenComplaints()
    } catch (err) {
      setBidError(err.response?.data?.error || 'Failed to submit bid')
    } finally {
      setBidLoading(false)
    }
  }

  const updateProgress = async (taskId, progress) => {
    setUpdatingTaskId(taskId)
    try {
      await axios.patch(`${API}/api/tasks/${taskId}/progress`, { progress: parseInt(progress) }, { headers })
      await fetchTasks()
      alert('Progress updated!')
    } catch (e) {
      alert('Error updating progress')
    } finally {
      setUpdatingTaskId(null)
    }
  }

  const handleProgressChange = (taskId, newProgress) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, completion_percentage: newProgress } : t))
  }

  // Upload progress photo
  const uploadProgressPhoto = async (taskId, file) => {
    if (!file) return
    setUploadingProgressId(taskId)
    try {
      const formData = new FormData()
      formData.append('photo', file)
      await axios.post(`${API}/api/tasks/${taskId}/upload-progress`, formData, {
        headers: { ...headers, 'Content-Type': 'multipart/form-data' }
      })
      await fetchTasks()
      setTaskSuccess('Progress photo uploaded successfully!')
      setTimeout(() => setTaskSuccess(''), 5000)
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to upload photo')
    } finally {
      setUploadingProgressId(null)
    }
  }

  // Mark task as complete
  const markComplete = async (taskId) => {
    setUpdatingTaskId(taskId)
    try {
      const formData = new FormData()
      if (completionFile) {
        formData.append('completion_photo', completionFile)
      }
      await axios.post(`${API}/api/tasks/${taskId}/mark-complete`, formData, {
        headers: { ...headers, 'Content-Type': 'multipart/form-data' }
      })
      setCompletingTaskId(null)
      setCompletionFile(null)
      setCompletionPreview(null)
      await fetchTasks()
      alert('Task marked as complete! Awaiting ministry approval.')
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to mark complete')
    } finally {
      setUpdatingTaskId(null)
    }
  }

  const getProgressColor = (p) => {
    if (p === 0) return 'bg-gray-300'
    if (p < 50) return 'bg-red-400'
    if (p < 80) return 'bg-yellow-400'
    if (p < 100) return 'bg-blue-400'
    return 'bg-green-500'
  }

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getComplaintStatusBadge = (status) => {
    const colors = {
      'Pending': 'bg-yellow-100 text-yellow-800',
      'In Progress': 'bg-blue-100 text-blue-800',
      'Vendor Complete': 'bg-purple-100 text-purple-800',
      'Complete': 'bg-green-100 text-green-800',
      'Archived': 'bg-green-100 text-green-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  // Split tasks for active vs history
  const activeTasks = tasks.filter(t => !t.user_confirmed_at && !['Archived'].includes(t.complaint_status))
  const historyTasks = tasks.filter(t => t.user_confirmed_at || ['Archived', 'Complete'].includes(t.complaint_status))

  const handleAcknowledgeWarning = async (bidId) => {
    try {
      await axios.post(`${API}/api/bids/${bidId}/acknowledge-warning`, {}, { headers })
      fetchMyBids()
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to acknowledge warning')
    }
  }

  const navItems = [
    { id: 'bid', label: 'Bid for Tasks', icon: FaGavel },
    { id: 'mybids', label: 'My Bids', icon: FaList },
    { id: 'tasks', label: 'My Tasks', icon: FaTasks },
    { id: 'history', label: 'History', icon: FaHistory },
    { id: 'profile', label: 'Bank Profile', icon: FaBuilding },
  ]

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">Vendor Portal</h2>
          <p className="text-sm text-gray-500 mt-1">CivicTrack</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center px-4 py-3 rounded-lg transition-all ${
                activeTab === item.id
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <item.icon className="mr-3" />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t">
          <button onClick={() => { setToken(''); navigate('/login') }} className="w-full flex items-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg">
            <FaSignOutAlt className="mr-3" /> Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-auto">
        {/* ===== BID FOR TASKS TAB ===== */}
        {activeTab === 'bid' && (
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Open Complaints</h1>
            <p className="text-gray-600 mb-6">Browse pending complaints and place your bid</p>

            {bidSuccess && <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-lg">{bidSuccess}</div>}
            {bidError && <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-lg">{bidError}</div>}

            {loading ? (
              <div className="text-center py-12 text-gray-500">Loading...</div>
            ) : openComplaints.length === 0 ? (
              <div className="text-center py-12">
                <FaGavel className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-gray-600">No open complaints available</h3>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {openComplaints.map(c => (
                  <div key={c.id} className="bg-white rounded-xl shadow-sm border flex flex-col overflow-hidden">
                    {c.image_url && (
                      <div className="w-full h-48 bg-gray-100 overflow-hidden">
                        <img
                          src={`${API}${c.image_url}`}
                          alt={c.title || 'Complaint photo'}
                          className="w-full h-full object-cover"
                          onError={e => { e.target.style.display = 'none' }}
                        />
                      </div>
                    )}
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">{c.ministry_name}</span>
                        <span className="text-xs text-gray-400">#{c.id}</span>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{c.title || 'Untitled'}</h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-3 flex-1">{c.description}</p>

                      {(c.location || c.latitude) && (
                        <div className="flex items-center text-xs text-gray-500 mb-3 bg-gray-50 px-3 py-2 rounded-lg">
                          <svg className="w-4 h-4 mr-1.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="truncate">
                            {c.location || `${Number(c.latitude).toFixed(4)}, ${Number(c.longitude).toFixed(4)}`}
                          </span>
                        </div>
                      )}

                      <div className="text-xs text-gray-400 mb-3">
                        {new Date(c.created_at).toLocaleDateString()}
                      </div>

                      {c.my_bids > 0 ? (
                        <div className="bg-green-50 text-green-700 text-sm font-medium py-2 px-3 rounded-lg text-center">
                          ✓ You've already bid on this
                        </div>
                      ) : bidComplaintId === c.id ? (
                        <form onSubmit={submitBid} className="space-y-3 border-t pt-3">
                          <div>
                            <label className="text-xs font-medium text-gray-700">Budget (₹)</label>
                            <input type="number" min="1" required value={bidBudget}
                              onChange={e => setBidBudget(e.target.value)}
                              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Your budget" />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-700">Timeline (days)</label>
                            <input type="number" min="1" required value={bidDays}
                              onChange={e => setBidDays(e.target.value)}
                              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Estimated days" />
                          </div>
                          <div className="flex gap-2">
                            <button type="submit" disabled={bidLoading}
                              className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                              {bidLoading ? 'Submitting...' : 'Submit Bid'}
                            </button>
                            <button type="button" onClick={() => setBidComplaintId(null)}
                              className="px-4 py-2 bg-gray-200 rounded-lg text-sm hover:bg-gray-300">
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <button onClick={() => { setBidComplaintId(c.id); setBidError(''); setBidSuccess('') }}
                          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:shadow-lg transition-all">
                          <FaGavel className="inline mr-2" /> Place Bid
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== MY BIDS TAB ===== */}
        {activeTab === 'mybids' && (
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bids</h1>
            <p className="text-gray-600 mb-6">Track the status of your submitted bids</p>

            {loading ? (
              <div className="text-center py-12 text-gray-500">Loading...</div>
            ) : myBids.filter(bid => !['Complete', 'Resolved', 'Withdrawn', 'Archived', 'Rejected (Acknowledged)'].includes(bid.complaint_status)).length === 0 ? (
              <div className="text-center py-12">
                <FaList className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-gray-600">No active bids found</h3>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Complaint</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ministry</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Budget (₹)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timeline</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bid Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {myBids.filter(bid => !['Complete', 'Resolved', 'Withdrawn', 'Archived', 'Rejected (Acknowledged)'].includes(bid.complaint_status)).map(bid => (
                      <tr key={bid.id} className={`hover:bg-gray-50 ${bid.status === 'warned' ? 'bg-red-50' : ''}`}>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900 max-w-xs truncate">{bid.complaint_title}</div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{bid.ministry_name}</td>
                        <td className="px-6 py-4 font-semibold">₹{Number(bid.budget).toLocaleString()}</td>
                        <td className="px-6 py-4">{bid.estimated_time} days</td>
                        <td className="px-6 py-4">
                          {bid.status === 'warned' ? (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              ⚠️ Warning Issued
                            </span>
                          ) : (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(bid.status)}`}>
                              {bid.status}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {bid.status === 'warned' ? (
                            <button onClick={() => handleAcknowledgeWarning(bid.id)}
                              className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition">
                              Okay, I understand
                            </button>
                          ) : (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getComplaintStatusBadge(bid.complaint_status)}`}>
                              {bid.complaint_status}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ===== ASSIGNED TASKS TAB ===== */}
        {activeTab === 'tasks' && (
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Assigned Tasks</h1>
            <p className="text-gray-600 mb-6">Track progress, upload photos, and mark tasks complete</p>

            {taskSuccess && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg flex items-center">
                <FaCheckCircle className="mr-2" />
                {taskSuccess}
              </div>
            )}

            {loading ? (
              <div className="text-center py-12 text-gray-500">Loading...</div>
            ) : activeTasks.length === 0 ? (
              <div className="text-center py-12">
                <FaTools className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-gray-600">No active tasks</h3>
                <p className="text-sm text-gray-500 mt-1">Tasks will appear here when your bids are approved</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {activeTasks.map(task => (
                  <div key={task.id} className="bg-white rounded-xl shadow-sm border p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{task.title}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2">{task.description}</p>
                        <div className="text-xs text-gray-400 mt-2">Ministry: {task.ministry_name}</div>
                        <span className={`mt-2 inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getComplaintStatusBadge(task.complaint_status)}`}>
                          {task.complaint_status}
                        </span>
                      </div>
                      {task.vendor_completed_at && <FaCheckCircle className="text-green-500 ml-2 flex-shrink-0" />}
                    </div>

                    {/* Progress */}
                    <div className="mb-4">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">Progress</span>
                        <span className="text-sm font-semibold">{task.completion_percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className={`h-2 rounded-full transition-all ${getProgressColor(task.completion_percentage)}`}
                          style={{ width: `${task.completion_percentage}%` }} />
                      </div>
                    </div>

                    {/* Progress Photos Thumbnails */}
                    {task.progress_photos && (
                      <div className="mb-4">
                        <div className="text-xs font-medium text-gray-500 mb-2">Progress Photos</div>
                        <div className="flex flex-wrap gap-2">
                          {task.progress_photos.split(',').map((photo, i) => (
                            <a key={i} href={`${API}${photo}`} target="_blank" rel="noreferrer">
                              <img src={`${API}${photo}`} alt={`Progress ${i+1}`}
                                className="w-12 h-12 object-cover rounded border hover:opacity-80 transition" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Completion Photo */}
                    {task.completion_photo_url && (
                      <div className="mb-4">
                        <div className="text-xs font-medium text-gray-500 mb-2">Completion Photo</div>
                        <a href={`${API}${task.completion_photo_url}`} target="_blank" rel="noreferrer">
                          <img src={`${API}${task.completion_photo_url}`} alt="Completion"
                            className="w-full h-32 object-cover rounded border hover:opacity-80 transition" />
                        </a>
                      </div>
                    )}

                    {/* Actions only if vendor hasn't completed yet */}
                    {!task.vendor_completed_at ? (
                      <>
                        {/* Slider */}
                        <div className="mb-4">
                          <input type="range" min="0" max="99" value={task.completion_percentage}
                            onChange={e => handleProgressChange(task.id, parseInt(e.target.value))}
                            className="w-full" disabled={updatingTaskId === task.id} />
                        </div>

                        <div className="flex gap-2 mb-3">
                          <button onClick={() => updateProgress(task.id, task.completion_percentage)}
                            disabled={updatingTaskId === task.id}
                            className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                            {updatingTaskId === task.id ? (
                              <><FaClock className="inline animate-spin mr-2" />Updating...</>
                            ) : 'Update Progress'}
                          </button>
                        </div>

                        {/* Upload Progress Photo */}
                        <div className="mb-3">
                          <input type="file" accept="image/*" ref={progressFileRef} className="hidden"
                            onChange={e => {
                              if (e.target.files[0]) uploadProgressPhoto(task.id, e.target.files[0])
                            }} />
                          <button onClick={() => progressFileRef.current?.click()}
                            disabled={uploadingProgressId === task.id}
                            className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50">
                            <FaCamera /> {uploadingProgressId === task.id ? 'Uploading...' : 'Upload Progress Photo'}
                          </button>
                        </div>

                        {/* Mark Complete */}
                        {completingTaskId === task.id ? (
                          <div className="border-t pt-3 space-y-3">
                            <p className="text-sm text-gray-600 font-medium">Upload completion photo (optional):</p>
                            <input type="file" accept="image/*" ref={completionFileRef} className="hidden"
                              onChange={e => {
                                if (e.target.files[0]) {
                                  setCompletionFile(e.target.files[0])
                                  setCompletionPreview(URL.createObjectURL(e.target.files[0]))
                                }
                              }} />
                            {completionPreview ? (
                              <div className="relative">
                                <img src={completionPreview} alt="Completion preview" className="w-full h-32 object-cover rounded border" />
                                <button onClick={() => { setCompletionFile(null); setCompletionPreview(null) }}
                                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center">✕</button>
                              </div>
                            ) : (
                              <button onClick={() => completionFileRef.current?.click()}
                                className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 text-gray-500 py-4 rounded-lg hover:border-blue-400 hover:text-blue-500 transition">
                                <FaImage /> Select Photo
                              </button>
                            )}
                            <div className="flex gap-2">
                              <button onClick={() => markComplete(task.id)}
                                disabled={updatingTaskId === task.id}
                                className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                                {updatingTaskId === task.id ? 'Submitting...' : '✓ Confirm Complete'}
                              </button>
                              <button onClick={() => { setCompletingTaskId(null); setCompletionFile(null); setCompletionPreview(null) }}
                                className="px-4 py-2 bg-gray-200 rounded-lg text-sm hover:bg-gray-300">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => setCompletingTaskId(task.id)}
                            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-2 rounded-lg text-sm font-medium hover:shadow-lg transition-all">
                            <FaCheckCircle className="inline mr-2" /> Mark as Complete
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="bg-green-50 text-green-700 text-sm font-medium py-3 px-4 rounded-lg text-center">
                        {task.ministry_approved_at
                          ? '✓ Ministry approved — awaiting user confirmation'
                          : '⏳ Awaiting ministry approval'}
                      </div>
                    )}

                    <div className="mt-3 text-xs text-gray-400">
                      Assigned: {new Date(task.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== PROFILE TAB ===== */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Bank Profile</h1>
            <p className="text-gray-600 mb-6">Manage your bank details to receive payments</p>
            {bankMessage && (
              <div className={`mb-6 p-4 rounded-lg ${bankMessage.includes('success') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                {bankMessage}
              </div>
            )}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <form onSubmit={saveBankDetails} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                  <input required value={bankDetails.bank_name} onChange={e => setBankDetails({...bankDetails, bank_name: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. State Bank of India" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                  <input required type="text" value={bankDetails.account_number} onChange={e => setBankDetails({...bankDetails, account_number: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Enter account number" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                  <input required type="text" value={bankDetails.ifsc_code} onChange={e => setBankDetails({...bankDetails, ifsc_code: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. SBIN0001234" />
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700">
                  Save Bank Details
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ===== HISTORY TAB ===== */}
        {activeTab === 'history' && (
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Completed Tasks History</h1>
            <p className="text-gray-600 mb-6">Archive of your completed and archived tasks</p>

            {loading ? (
              <div className="text-center py-12 text-gray-500">Loading...</div>
            ) : historyTasks.length === 0 && historyBids.length === 0 ? (
              <div className="text-center py-12">
                <FaHistory className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-gray-600">No history available yet</h3>
              </div>
            ) : (
              <div className="space-y-4">
                {historyBids.map(bid => (
                  <div key={`bid-${bid.id}`} className="bg-red-50 rounded-xl shadow-sm border border-red-200 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{bid.complaint_title}</h3>
                        <p className="text-sm text-gray-500">{bid.ministry_name}</p>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          ⚠️ Warning Acknowledged
                        </span>
                        <p className="text-xs text-gray-400 mt-1">
                          Bid: ₹{Number(bid.budget).toLocaleString()} for {bid.estimated_time} days
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {historyTasks.map(task => (
                  <div key={`task-${task.id}`} className="bg-white rounded-xl shadow-sm border p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{task.title}</h3>
                        <p className="text-sm text-gray-500">{task.ministry_name}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getComplaintStatusBadge(task.complaint_status)}`}>
                          {task.complaint_status === 'Archived' ? 'Completed' : task.complaint_status}
                        </span>
                        <p className="text-xs text-gray-400 mt-1">
                          Completed: {task.vendor_completed_at ? new Date(task.vendor_completed_at).toLocaleDateString() : '—'}
                        </p>
                      </div>
                    </div>
                    {task.completion_photo_url && (
                      <div className="mt-3">
                        <a href={`${API}${task.completion_photo_url}`} target="_blank" rel="noreferrer">
                          <img src={`${API}${task.completion_photo_url}`} alt="Completion"
                            className="w-full h-40 object-cover rounded border hover:opacity-80 transition" />
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}