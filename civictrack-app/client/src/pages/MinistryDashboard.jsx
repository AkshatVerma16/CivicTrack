import { useState, useEffect } from 'react'
import { useAdminAuth } from '../context/AdminAuthContext.jsx'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { FaEye, FaGavel, FaTasks, FaCheck, FaTimes, FaExclamationTriangle, FaSignOutAlt, FaImage, FaCheckCircle, FaHistory, FaMoneyBillWave } from 'react-icons/fa'

const API = 'http://localhost:3000'

export default function MinistryDashboard() {
  const { token, setToken } = useAdminAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('complaints')
  const [complaints, setComplaints] = useState([])
  const [tasks, setTasks] = useState([])
  const [reportedBids, setReportedBids] = useState([])
  const [paymentTasks, setPaymentTasks] = useState([])
  const [loading, setLoading] = useState(false)

  // Bids modal
  const [selectedComplaint, setSelectedComplaint] = useState(null)
  const [bids, setBids] = useState([])
  const [bidsLoading, setBidsLoading] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportingBidId, setReportingBidId] = useState(null)
  
  // Complaint Reporting
  const [reportingComplaintId, setReportingComplaintId] = useState(null)
  const [complaintReportReason, setComplaintReportReason] = useState('')

  // Completion review modal
  const [reviewingTask, setReviewingTask] = useState(null)

  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    if (activeTab === 'complaints') fetchComplaints()
    if (activeTab === 'tasks') fetchTasks()
    if (activeTab === 'history') { fetchTasks(); fetchReportedBids() }
  }, [activeTab])

  // Dedicated effect for Payments tab
  useEffect(() => {
    if (activeTab === 'payments') fetchPayments()
  }, [activeTab])

  const fetchComplaints = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${API}/api/complaints/ministry/complaints`, { headers })
      setComplaints(res.data)
    } catch (e) { console.error('Error fetching complaints:', e) }
    finally { setLoading(false) }
  }

  const fetchTasks = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${API}/api/tasks/ministry`, { headers })
      setTasks(res.data)
    } catch (e) { console.error('Error fetching tasks:', e) }
    finally { setLoading(false) }
  }

  const fetchPayments = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${API}/api/payments/pending`, { headers })
      setPaymentTasks(Array.isArray(res.data) ? res.data : [])
    } catch (e) {
      console.error('Error fetching payments:', e)
      setPaymentTasks([])
    } finally {
      setLoading(false)
    }
  }

  const fetchReportedBids = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${API}/api/bids/ministry/reported`, { headers })
      setReportedBids(res.data)
    } catch (e) { console.error('Error fetching reported bids:', e) }
    finally { setLoading(false) }
  }

  // Show bids for a complaint
  const viewBids = async (complaint) => {
    setSelectedComplaint(complaint)
    setBidsLoading(true)
    try {
      const res = await axios.get(`${API}/api/bids/${complaint.id}`, { headers })
      setBids(res.data)
    } catch (e) {
      setBids([])
    }
    setBidsLoading(false)
  }

  const closeBidsModal = () => {
    setSelectedComplaint(null)
    setBids([])
    setReportingBidId(null)
    setReportReason('')
  }

  // Approve a bid
  const approveBid = async (bidId) => {
    if (!window.confirm('Approve this bid? This will assign the task to this vendor and reject other bids.')) return
    try {
      await axios.post(`${API}/api/bids/${bidId}/approve`, {}, { headers })
      alert('Bid approved! Task has been created and complaint is now In Progress.')
      closeBidsModal()
      fetchComplaints()
      fetchTasks()
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to approve bid')
    }
  }

  // Report a bid
  const reportBid = async (bidId) => {
    try {
      await axios.post(`${API}/api/bids/${bidId}/report`, { reason: reportReason }, { headers })
      alert('Bid reported to admin for review.')
      setReportingBidId(null)
      setReportReason('')
      viewBids(selectedComplaint)
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to report bid')
    }
  }

  // Report a complaint (fake complaint)
  const reportComplaint = async (complaintId) => {
    try {
      await axios.post(`${API}/api/complaints/${complaintId}/report`, { reason: complaintReportReason }, { headers })
      alert('Complaint reported to admin for review.')
      setReportingComplaintId(null)
      setComplaintReportReason('')
      fetchComplaints()
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to report complaint')
    }
  }

  // Request a payment
  const requestPayment = async (taskId) => {
    if (!window.confirm('Verify and forward this payment request to the Admin?')) return
    try {
      await axios.post(`${API}/api/payments/request`, { task_id: taskId }, { headers })
      alert('Payment request forwarded to Admin.')
      fetchPayments()
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to request payment')
    }
  }

  // Reject a complaint
  const rejectComplaint = async (complaintId) => {
    if (!window.confirm('Are you sure you want to reject this complaint? The user will be notified.')) return
    try {
      await axios.post(`${API}/api/complaints/${complaintId}/reject`, {}, { headers })
      alert('Complaint rejected.')
      fetchComplaints()
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to reject complaint')
    }
  }

  // Approve a complaint (transition from Pending to Open)
  const approveComplaint = async (complaintId) => {
    if (!window.confirm('Approve this complaint? This will make it visible to vendors for bidding.')) return
    try {
      await axios.post(`${API}/api/complaints/${complaintId}/approve-complaint`, {}, { headers })
      alert('Complaint approved and opened for bidding.')
      fetchComplaints()
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to approve complaint')
    }
  }

  // Approve vendor completion
  const approveCompletion = async (taskId) => {
    if (!window.confirm('Approve this vendor completion? The citizen will be notified to confirm.')) return
    try {
      await axios.post(`${API}/api/tasks/${taskId}/ministry-approve`, {}, { headers })
      alert('Completion approved! The citizen has been notified.')
      setReviewingTask(null)
      fetchTasks()
      fetchComplaints()
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to approve completion')
    }
  }

  const handleViewPhoto = (imageUrl) => {
    if (imageUrl) window.open(`${API}${imageUrl}`, '_blank')
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800'
      case 'Open': return 'bg-green-100 text-green-800'
      case 'In Progress': return 'bg-blue-100 text-blue-800'
      case 'Vendor Complete': return 'bg-purple-100 text-purple-800'
      case 'Complete': return 'bg-green-100 text-green-800'
      case 'Archived': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const navItems = [
    { id: 'complaints', label: 'Complaints', icon: FaEye },
    { id: 'tasks', label: 'Task Overview', icon: FaTasks },
    { id: 'history', label: 'History', icon: FaHistory },
    { id: 'payments', label: 'Payments', icon: FaMoneyBillWave },
  ]

  // Find the lowest bid
  const getLowestBid = (bidList) => {
    if (!bidList.length) return null
    const minBudget = Math.min(...bidList.map(b => Number(b.budget)))
    const cheapest = bidList.filter(b => Number(b.budget) === minBudget)
    const minTime = Math.min(...cheapest.map(b => Number(b.estimated_time)))
    return cheapest.find(b => Number(b.estimated_time) === minTime)
  }

  // Separate tasks
  const pendingApprovalTasks = tasks.filter(t => t.vendor_completed_at && !t.ministry_approved_at)
  const inProgressTasks = tasks.filter(t => !t.vendor_completed_at)
  const waitingForUserTasks = tasks.filter(t => t.ministry_approved_at && t.complaint_status !== 'Archived')
  const completedTasks = tasks.filter(t => t.complaint_status === 'Archived')

  // Active complaints (exclude completed, archived, and acknowledged warnings/rejections)
  const activeComplaints = complaints.filter(c => !['In Progress', 'Vendor Complete', 'Complete', 'Resolved', 'Archived', 'Warned (Acknowledged)', 'Rejected (Acknowledged)'].includes(c.status))

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">Ministry Portal</h2>
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
              {item.id === 'tasks' && pendingApprovalTasks.length > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {pendingApprovalTasks.length}
                </span>
              )}
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
      <div className="flex-1 p-6 overflow-auto">

        {/* ===== COMPLAINTS TAB ===== */}
        {activeTab === 'complaints' && (
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Complaints Management</h1>
            <p className="text-gray-600 mb-6">View complaints, review vendor bids, and approve assignments</p>

            {loading ? (
              <div className="text-center py-12 text-gray-500">Loading complaints...</div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reporter</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Photo</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {activeComplaints.map(c => (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <div className="font-medium text-gray-900">{c.title || 'Untitled'}</div>
                          <div className="text-xs text-gray-500 mt-1 max-w-xs truncate">{c.description?.substring(0, 60)}...</div>
                        </td>
                        <td className="px-4 py-4 text-gray-600">{c.reporter_name || '—'}</td>
                        <td className="px-4 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(c.status)}`}>
                            {c.status === 'Archived' ? 'Completed' : c.status}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          {c.image_url ? (
                            <button onClick={() => handleViewPhoto(c.image_url)} className="text-blue-600 hover:text-blue-800 text-xs">
                              <FaEye className="inline mr-1" />View
                            </button>
                          ) : <span className="text-gray-400 text-xs">—</span>}
                        </td>
                        <td className="px-4 py-4">
                          {(c.latitude && c.longitude) ? (
                            <a href={`https://maps.google.com/maps?q=${c.latitude},${c.longitude}`} target="_blank" rel="noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-xs">
                              📍 View Map
                            </a>
                          ) : <span className="text-gray-400 text-xs">—</span>}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col gap-2">
                              {(c.status === 'Open' || c.status === 'In Progress') && (
                                <button onClick={() => viewBids(c)}
                                  className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-100 text-indigo-800 hover:bg-indigo-200 transition-colors">
                                  <FaGavel className="mr-1" />
                                  View Bids
                                </button>
                              )}
                              
                              {c.status === 'Pending' && (
                                <button onClick={() => approveComplaint(c.id)}
                                  className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-medium bg-green-600 text-white hover:bg-green-700 transition-colors shadow-sm">
                                  <FaCheck className="mr-1" />
                                  Approve
                                </button>
                              )}
                              
                              {(c.status === 'Pending' || c.status === 'Open') && (
                                reportingComplaintId === c.id ? (
                                  <div className="flex flex-col gap-1 mt-1">
                                    <input 
                                      type="text" 
                                      value={complaintReportReason} 
                                      onChange={e => setComplaintReportReason(e.target.value)} 
                                      placeholder="Reason..." 
                                      className="text-xs border rounded px-2 py-1 w-full"
                                    />
                                    <div className="flex gap-1">
                                      <button onClick={() => reportComplaint(c.id)} className="flex-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 py-1">Submit</button>
                                      <button onClick={() => { setReportingComplaintId(null); setComplaintReportReason('') }} className="flex-1 bg-gray-200 text-gray-800 text-xs rounded hover:bg-gray-300 py-1">Cancel</button>
                                    </div>
                                  </div>
                                ) : (
                                  <button onClick={() => setReportingComplaintId(c.id)}
                                    className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 transition-colors">
                                    <FaExclamationTriangle className="mr-1" />
                                    Report Fake
                                  </button>
                                )
                              )}
                                
                                {(c.status === 'Pending' || c.status === 'Open') && (
                                  <button onClick={() => rejectComplaint(c.id)}
                                    className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
                                    <FaTimes className="mr-1" />
                                    Reject
                                  </button>
                                )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {complaints.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-gray-400">No complaints found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ===== TASKS TAB ===== */}
        {activeTab === 'tasks' && (
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Task Overview</h1>
            <p className="text-gray-600 mb-6">Track vendor progress and approve completions</p>

            {loading ? (
              <div className="text-center py-12 text-gray-500">Loading tasks...</div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <FaTasks className="mx-auto h-12 w-12 mb-2" />
                No tasks assigned yet. Approve bids from the Complaints tab.
              </div>
            ) : (
              <div className="space-y-8">

                {/* Pending Approval Section */}
                {pendingApprovalTasks.length > 0 && (
                  <div>
                    <h2 className="text-lg font-bold text-purple-700 mb-4 flex items-center">
                      <FaCheckCircle className="mr-2" /> Awaiting Your Approval ({pendingApprovalTasks.length})
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2">
                      {pendingApprovalTasks.map(task => (
                        <div key={task.id} className="bg-white rounded-xl shadow-sm border-2 border-purple-200 p-5">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-semibold text-gray-900">{task.complaint_title || task.title}</h3>
                              <p className="text-sm text-gray-500">Vendor: {task.vendor_name || 'Unknown'}</p>
                            </div>
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              Vendor Complete
                            </span>
                          </div>

                          {/* Completion Photo */}
                          {task.completion_photo_url && (
                            <div className="mb-3">
                              <p className="text-xs text-gray-500 mb-1">Completion Photo:</p>
                              <a href={`${API}${task.completion_photo_url}`} target="_blank" rel="noreferrer">
                                <img src={`${API}${task.completion_photo_url}`} alt="Completion"
                                  className="w-full h-40 object-cover rounded-lg border hover:opacity-80 transition" />
                              </a>
                            </div>
                          )}

                          {/* Progress Photos */}
                          {task.progress_photos && (
                            <div className="mb-3">
                              <p className="text-xs text-gray-500 mb-1">Progress Photos:</p>
                              <div className="flex flex-wrap gap-2">
                                {task.progress_photos.split(',').map((photo, i) => (
                                  <a key={i} href={`${API}${photo}`} target="_blank" rel="noreferrer">
                                    <img src={`${API}${photo}`} alt={`Progress ${i+1}`}
                                      className="w-12 h-12 object-cover rounded border hover:opacity-80" />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="text-xs text-gray-400 mb-3">
                            Completed: {new Date(task.vendor_completed_at).toLocaleString()}
                          </div>

                          <button onClick={() => approveCompletion(task.id)}
                            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-2.5 rounded-lg text-sm font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2">
                            <FaCheck /> Approve Completion
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* In Progress Section */}
                {inProgressTasks.length > 0 && (
                  <div>
                    <h2 className="text-lg font-bold text-blue-700 mb-4">In Progress ({inProgressTasks.length})</h2>
                    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Complaint</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status Updates</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Photos</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {inProgressTasks.map(task => (
                            <tr key={task.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 font-medium text-gray-900">{task.complaint_title || task.title}</td>
                              <td className="px-6 py-4 text-gray-600">{task.vendor_name || 'Unknown'}</td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-24 bg-gray-200 rounded-full h-2">
                                    <div className={`h-2 rounded-full ${task.completion_percentage === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                                      style={{ width: `${task.completion_percentage}%` }} />
                                  </div>
                                  <span className="text-sm font-semibold">{task.completion_percentage}%</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-xs text-gray-500 max-w-xs truncate">{task.status_updates}</td>
                              <td className="px-6 py-4">
                                {task.progress_photos ? (
                                  <div className="flex flex-wrap gap-1">
                                    {task.progress_photos.split(',').map((photo, i) => (
                                      <a key={i} href={`${API}${photo}`} target="_blank" rel="noreferrer">
                                        <img src={`${API}${photo}`} alt={`Progress ${i+1}`} className="w-8 h-8 object-cover rounded border hover:opacity-80" />
                                      </a>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-gray-400 text-xs">—</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Waiting for User Confirmation Section */}
                {waitingForUserTasks.length > 0 && (
                  <div className="mt-8">
                    <h2 className="text-lg font-bold text-orange-600 mb-4">Waiting User Confirmation ({waitingForUserTasks.length})</h2>
                    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-orange-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Complaint</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ministry Approved On</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {waitingForUserTasks.map(task => (
                            <tr key={task.id} className="hover:bg-orange-50">
                              <td className="px-6 py-4 font-medium text-gray-900">{task.complaint_title || task.title}</td>
                              <td className="px-6 py-4 text-gray-600">{task.vendor_name || 'Unknown'}</td>
                              <td className="px-6 py-4 text-gray-600">{new Date(task.ministry_approved_at).toLocaleDateString()}</td>
                              <td className="px-6 py-4">
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                  Pending Citizen
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        )}

        {/* ===== HISTORY TAB ===== */}
        {activeTab === 'history' && (
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">History</h1>
            <p className="text-gray-600 mb-6">Archive of your completed tasks and reported vendor bids</p>

            {loading ? (
              <div className="text-center py-12 text-gray-500">Loading history...</div>
            ) : completedTasks.length === 0 && reportedBids.length === 0 ? (
              <div className="text-center py-12">
                <FaHistory className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <p className="text-gray-500 text-lg">No history logs available yet.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Reported Bids History */}
                {reportedBids.length > 0 && (
                  <div>
                    <h2 className="text-lg font-bold text-red-700 mb-4">Reported Bids</h2>
                    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-red-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Complaint</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {reportedBids.map(rb => (
                            <tr key={rb.id} className="hover:bg-red-50">
                              <td className="px-6 py-4 font-medium text-gray-900">{rb.vendor_name}</td>
                              <td className="px-6 py-4 text-gray-600">{rb.complaint_title}</td>
                              <td className="px-6 py-4 text-gray-600">{rb.reason || 'No specific reason'}</td>
                              <td className="px-6 py-4 text-gray-500">{new Date(rb.created_at).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Completed Tasks History */}
                {completedTasks.length > 0 && (
                  <div>
                    <h2 className="text-lg font-bold text-green-700 mb-4">Completed Tasks</h2>
                    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Complaint</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Approved On</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {completedTasks.map(task => (
                            <tr key={task.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 font-medium text-gray-900">{task.complaint_title || task.title}</td>
                              <td className="px-6 py-4 text-gray-600">{task.vendor_name || 'Deleted Vendor'}</td>
                              <td className="px-6 py-4 text-gray-600">{new Date(task.ministry_approved_at).toLocaleDateString()}</td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.complaint_status)}`}>
                                  {task.complaint_status === 'Archived' ? 'Completed' : task.complaint_status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Closed Complaints History (Acknowledged Warnings/Rejections) */}
                {complaints.filter(c => ['Warned (Acknowledged)', 'Rejected (Acknowledged)'].includes(c.status)).length > 0 && (
                  <div>
                    <h2 className="text-lg font-bold text-gray-700 mb-4">Closed Complaints</h2>
                    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Complaint</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reporter</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Final Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {complaints.filter(c => ['Warned (Acknowledged)', 'Rejected (Acknowledged)'].includes(c.status)).map(c => (
                            <tr key={c.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 font-medium text-gray-900">{c.title}</td>
                              <td className="px-6 py-4 text-gray-600">{c.reporter_name}</td>
                              <td className="px-6 py-4 text-gray-600">{c.status}</td>
                              <td className="px-6 py-4 text-gray-500">{new Date(c.created_at).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ===== PAYMENTS TAB ===== */}
        {activeTab === 'payments' && (
          <div className="max-w-7xl mx-auto space-y-8">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <FaMoneyBillWave className="text-green-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
                  <p className="text-sm text-gray-500">Verify and forward payments to Admin</p>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-12">Loading...</div>
              ) : paymentTasks.length === 0 ? (
                <div className="text-center py-12 text-gray-500 bg-white rounded-xl shadow-sm border border-dashed border-gray-300">
                  <FaMoneyBillWave className="mx-auto h-10 w-10 text-gray-300 mb-3" />
                  <p>No pending payments for completed tasks</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-4 font-semibold text-gray-700">Complaint Title</th>
                        <th className="px-6 py-4 font-semibold text-gray-700">Vendor Name</th>
                        <th className="px-6 py-4 font-semibold text-gray-700">Bid Amount (₹)</th>
                        <th className="px-6 py-4 font-semibold text-gray-700 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {paymentTasks.map(p => (
                        <tr key={p.id} className="hover:bg-gray-50/50">
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">{p.complaint_title}</div>
                            <div className="text-xs text-gray-500">Task ID: {p.id}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-gray-900">{p.vendor_name}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-gray-900">₹{Number(p.accepted_bid_amount).toLocaleString()}</div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {p.payment_id ? (
                              <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                                p.payment_status === 'paid'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {p.payment_status === 'paid' ? 'Paid' : 'Forwarded to Admin'}
                              </span>
                            ) : (
                              <button
                                onClick={() => requestPayment(p.id)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
                              >
                                Request Admin Payment
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== BIDS MODAL ===== */}
        {selectedComplaint && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-auto">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Vendor Bids</h2>
                    <p className="text-sm text-gray-600 mt-1">Complaint: {selectedComplaint.title || 'Untitled'}</p>
                    <span className={`mt-2 inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedComplaint.status)}`}>
                      {selectedComplaint.status === 'Archived' ? 'Completed' : selectedComplaint.status}
                    </span>
                  </div>
                  <button onClick={closeBidsModal} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                    <FaTimes />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {bidsLoading ? (
                  <div className="text-center py-8 text-gray-500">Loading bids...</div>
                ) : bids.length === 0 ? (
                  <div className="text-center py-8">
                    <FaGavel className="mx-auto h-10 w-10 text-gray-300 mb-2" />
                    <p className="text-gray-500">No vendor bids yet for this complaint.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(() => {
                      const visibleBids = bids.filter(b => b.status === 'pending' || b.status === 'accepted' || b.status === 'rejected')
                      if (visibleBids.length === 0) return <p className="text-gray-500 text-center py-4">No active bids available.</p>
                      const lowestBid = getLowestBid(visibleBids)
                      return visibleBids.map(bid => {
                        const isLowest = lowestBid && bid.id === lowestBid.id
                        return (
                          <div key={bid.id}
                            className={`border rounded-xl p-5 transition-all ${
                              isLowest ? 'border-green-400 bg-green-50 ring-2 ring-green-200' :
                              bid.status === 'accepted' ? 'border-blue-300 bg-blue-50' :
                              (bid.status === 'warned' || bid.status === 'warned_acknowledged') ? 'border-orange-200 bg-orange-50 opacity-70' :
                              bid.status === 'rejected' ? 'border-red-200 bg-red-50 opacity-60' :
                              'border-gray-200'
                            }`}>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  <h3 className="font-semibold text-gray-900">{bid.vendor_name}</h3>
                                  {isLowest && (
                                    <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full">
                                      ⭐ Best Price
                                    </span>
                                  )}
                                  {bid.is_rebid === 1 && (
                                    <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full">
                                      🔄 Second Attempt - Previously Reported
                                    </span>
                                  )}
                                  {bid.status !== 'pending' && (
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                      bid.status === 'accepted' ? 'bg-blue-200 text-blue-800' : 
                                      (bid.status === 'warned' || bid.status === 'warned_acknowledged') ? 'bg-orange-200 text-orange-800' :
                                      'bg-red-200 text-red-800'
                                    }`}>
                                      {bid.status === 'warned_acknowledged' ? 'warned (acknowledged)' : bid.status}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-500">{bid.vendor_email}</p>
                                <div className="flex gap-6 mt-3">
                                  <div>
                                    <div className="text-xs text-gray-400 uppercase">Budget</div>
                                    <div className="text-lg font-bold text-gray-900">₹{Number(bid.budget).toLocaleString()}</div>
                                  </div>
                                  <div>
                                    <div className="text-xs text-gray-400 uppercase">Timeline</div>
                                    <div className="text-lg font-bold text-gray-900">{bid.estimated_time} days</div>
                                  </div>
                                </div>
                              </div>

                              {/* Action buttons - Only show for Best Price bid */}
                              {bid.status === 'pending' && (selectedComplaint.status === 'Pending' || selectedComplaint.status === 'Open') && isLowest && (
                                <div className="flex flex-col gap-2 ml-4">
                                  <button onClick={() => approveBid(bid.id)}
                                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors">
                                    <FaCheck className="mr-1" /> Approve
                                  </button>

                                  {reportingBidId === bid.id ? (
                                    <div className="space-y-2">
                                      <textarea
                                        value={reportReason}
                                        onChange={e => setReportReason(e.target.value)}
                                        placeholder="Reason for reporting..."
                                        className="w-48 px-3 py-2 border rounded-lg text-xs"
                                        rows={2}
                                      />
                                      <div className="flex gap-1">
                                        <button onClick={() => reportBid(bid.id)}
                                          className="flex-1 px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700">
                                          Submit
                                        </button>
                                        <button onClick={() => { setReportingBidId(null); setReportReason('') }}
                                          className="px-2 py-1 bg-gray-200 text-xs rounded hover:bg-gray-300">
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button onClick={() => setReportingBidId(bid.id)}
                                      className="inline-flex items-center px-4 py-2 bg-orange-100 text-orange-800 text-xs font-medium rounded-lg hover:bg-orange-200 transition-colors">
                                      <FaExclamationTriangle className="mr-1" /> Report
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })
                    })()}
                  </div>
                )}
              </div>

              <div className="p-6 border-t bg-gray-50 rounded-b-2xl">
                <button onClick={closeBidsModal}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}