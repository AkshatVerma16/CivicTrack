
// All imports at the top
import { useRef, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminReportedVendorsPage from './AdminReportedVendorsPage.jsx';
import {
  adminListComplaints,
  adminUpdateComplaint,
  adminDeleteComplaint,
  adminListMinistries,
  adminCreateMinistry,
  adminUpdateMinistry,
  adminDeleteMinistry,
  adminListUsers,
  adminDeleteUser,
  adminListLogs,
} from '../lib/adminApi';
import {
  adminListVendorApplications,
  adminApproveVendorApplication,
  adminRejectVendorApplication
} from '../lib/adminVendorApi.js';
import { useAdminAuth } from '../context/AdminAuthContext.jsx';
import {
  FaTachometerAlt,
  FaBuilding,
  FaUsers,
  FaHistory,
  FaSearch,
  FaFilter,
  FaEdit,
  FaTrash,
  FaCheck,
  FaTimes,
  FaPlus,
  FaChartBar,
  FaSignOutAlt,
  FaExclamationTriangle,
  FaClock,
  FaCheckCircle,
  FaUserShield,
  FaCog,
  FaBell,
  FaFileAlt,
  FaEye,
  FaDownload,
  FaUserTie,
  FaUserCircle
} from 'react-icons/fa';

const statuses = ['Pending', 'In Progress', 'Resolved'];
const departments = ['Roads', 'Sanitation', 'Water', 'Electricity', 'Parks'];

// Main component starts here
const AdminDashboard = () => {
  // Always get token/context first so it's available for all hooks and functions
  const { token, setToken } = useAdminAuth();
  const navigate = useNavigate();
  // --- State Initialization ---
  // const [ministries, setMinistries] = useState([]); // Removed duplicate
  // const [users, setUsers] = useState([]); // Removed duplicate
  const [ministries, setMinistries] = useState([]);
  const [users, setUsers] = useState([]);
  const [vendors, setVendors] = useState([]);
  // --- Fetch Functions ---
  const [pendingApplications, setPendingApplications] = useState([]);
  const fetchPendingApplications = async () => {
    try {
      const data = await adminListVendorApplications(token);
      setPendingApplications(data);
    } catch (e) {
      // Optionally handle error
    }
  };
  const fetchMinistries = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminListMinistries(token);
      setMinistries(data);
    } catch (e) {
      setError('Failed to load ministries');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminListUsers(token);
      setUsers(data);
    } catch (e) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    setLoading(true);
    setError('');
    try {
      // If you have a dedicated vendors API, use it. Otherwise, filter users with role 'vendor'.
      const data = await adminListUsers(token);
      setVendors(data.filter(u => u.role === 'vendor'));
    } catch (e) {
      setError('Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };
  // --- Effect Hook ---
  useEffect(() => {
    fetchMinistries();
    fetchUsers();
    fetchVendors();
    fetchPendingApplications();
  }, [token]);

  // State declarations (must be before useMemo and functions)
  const [items, setItems] = useState([]);
  const [resetTarget, setResetTarget] = useState(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const resetInputRef = useRef();
  // const { token, setToken } = useAdminAuth(); // Already declared at the top
  // const navigate = useNavigate(); // Already declared at the top
  const [activeTab, setActiveTab] = useState('overview');
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  // const [ministries, setMinistries] = useState([]); // Removed duplicate
  // const [users, setUsers] = useState([]); // Removed duplicate
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ministryPayload, setMinistryPayload] = useState({ id: null, name: '', icon_identifier: '', username: '', password: '' });
  const [ministryMode, setMinistryMode] = useState('add');
  const [ministrySearch, setMinistrySearch] = useState('');
  const [debouncedMinistrySearch, setDebouncedMinistrySearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [debouncedUserSearch, setDebouncedUserSearch] = useState('');
  const [globalSearch, setGlobalSearch] = useState('');
  const [debouncedGlobalSearch, setDebouncedGlobalSearch] = useState('');

  // Fetch complaints and update items state
  const loadComplaints = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminListComplaints(token, { status: statusFilter, department: deptFilter });
      setItems(data);
    } catch (e) {
      setError('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  // Fetch complaints on mount and when filters change
  useEffect(() => {
    if (activeTab === 'overview') {
      loadComplaints();
    }
  }, [activeTab, statusFilter, deptFilter, token]);

    // Memoized analytics object for statistics cards
    const analytics = useMemo(() => {
      const total = items.length;
      const byStatus = items.reduce((acc, item) => {
        const key = item.status || 'Pending';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});
      return {
        total,
        pending: byStatus['Pending'] || 0,
        inProgress: byStatus['In Progress'] || 0,
        resolved: byStatus['Resolved'] || 0,
      };
    }, [items]);


  // Reset password API call
  const handleResetPassword = async (userOrMinistry) => {
    setResetTarget(userOrMinistry);
    setResetPassword('');
    setResetError('');
    setTimeout(() => resetInputRef.current?.focus(), 100);
  };

  const submitResetPassword = async (e) => {
    e.preventDefault();
    if (!resetPassword.trim()) {
      setResetError('Password required');
      return;
    }
    setResetLoading(true);
    setResetError('');
    try {
      // Call backend API to update password
      await fetch(`/api/admin/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: resetTarget.id, password: resetPassword }),
      });
      setResetTarget(null);
      setResetPassword('');
      alert('Password reset successfully!');
    } catch (err) {
      setResetError('Failed to reset password');
    } finally {
      setResetLoading(false);
    }
  };


// ...existing code (the main AdminDashboard function continues here)...

  const highlightText = (text = '', query = '') => {
    if (!query) return text
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = String(text).split(regex)
    return parts.map((part, index) =>
      regex.test(part) ? (
        <span key={`${part}-${index}`} className="bg-yellow-200 text-red-700 font-semibold">
          {part}
        </span>
      ) : (
        <span key={`${part}-${index}`}>{part}</span>
      ),
    )
  }


  // Only show users with role 'user' in Users tab
  const filteredUsers = useMemo(() => {
    return users.filter((user) => user.role === 'user')
      .filter((user) => {
        if (!debouncedUserSearch) return true
        const q = debouncedUserSearch.toLowerCase()
        const idMatch = String(user.id).includes(q)
        const nameMatch = user.name?.toLowerCase().includes(q)
        const emailMatch = user.email?.toLowerCase().includes(q)
        const usernameMatch = (user.username || user.email?.split('@')[0])?.toLowerCase().includes(q)
        return idMatch || nameMatch || emailMatch || usernameMatch
      })
  }, [users, debouncedUserSearch])

  // Ministries tab: use ministries state for full details
  const filteredMinistries = useMemo(() => {
    if (!debouncedMinistrySearch) return ministries;
    const q = debouncedMinistrySearch.toLowerCase();
    return ministries.filter((m) =>
      m.name?.toLowerCase().includes(q) ||
      (m.ministry_username || '').toLowerCase().includes(q) ||
      (m.ministry_email || '').toLowerCase().includes(q)
    );
  }, [ministries, debouncedMinistrySearch]);

  // Only show vendors with role 'vendor' in Vendors tab
  const filteredVendors = useMemo(() => {
    if (!vendors) return [];
    return vendors;
  }, [vendors]);

  // Profile tab: show the first admin user (current admin)
  const [profileEditing, setProfileEditing] = useState(false)
  const [profileForm, setProfileForm] = useState({ name: '', email: '', password: '' })
  const [profileError, setProfileError] = useState('')
  const [profileSuccess, setProfileSuccess] = useState('')
  const adminProfile = useMemo(() => {
    return users.find((user) => user.role === 'admin') || null
  }, [users])

  useEffect(() => {
    if (activeTab === 'profile' && adminProfile) {
      setProfileForm({ name: adminProfile.name || '', email: adminProfile.email || '', password: '' })
      setProfileEditing(false)
      setProfileError('')
      setProfileSuccess('')
    }
  }, [activeTab, adminProfile])

  const handleProfileSave = async (e) => {
    e.preventDefault()
    setProfileError('')
    setProfileSuccess('')
    try {
      // Only send changed fields
      const updates = {}
      if (profileForm.name !== adminProfile.name) updates.name = profileForm.name
      if (profileForm.email !== adminProfile.email) updates.email = profileForm.email
      if (profileForm.password) updates.password = profileForm.password
      if (Object.keys(updates).length === 0) {
        setProfileSuccess('No changes to save.')
        return
      }
      // Use adminApi to update profile (reuse user update endpoint)
      await fetch(`/api/users/${adminProfile.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(updates),
      })
      setProfileSuccess('Profile updated successfully!')
      setProfileEditing(false)
      loadUsers()
    } catch (e) {
      setProfileError('Failed to update profile')
    }
  }

  const filteredComplaints = useMemo(() => {
    if (!debouncedGlobalSearch) return items
    const q = debouncedGlobalSearch.toLowerCase()
    return items.filter((item) => {
      const idMatch = String(item.id).includes(q)
      const userMatch = item.user_name?.toLowerCase().includes(q) || item.user?.toLowerCase().includes(q)
      const categoryMatch = item.department?.toLowerCase().includes(q) || item.category?.toLowerCase().includes(q) || item.title?.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q)
      return idMatch || userMatch || categoryMatch
    })
  }, [items, debouncedGlobalSearch])

  const handleMinistrySave = async (e) => {
    e.preventDefault()
    if (!ministryPayload.name.trim()) {
      setError('Ministry name is required')
      return
    }
    
    if (ministryMode === 'add' && !ministryPayload.username.trim()) {
      setError('Username is required for new ministries')
      return
    }
    
    if (ministryMode === 'add' && !ministryPayload.password.trim()) {
      setError('Password is required for new ministries')
      return
    }
    
    setError('')

    try {
      if (ministryMode === 'add') {
        await adminCreateMinistry(token, {
          name: ministryPayload.name,
          icon_identifier: ministryPayload.icon_identifier,
          username: ministryPayload.username,
          password: ministryPayload.password,
        })
      } else {
        await adminUpdateMinistry(token, ministryPayload.id, {
          name: ministryPayload.name,
          icon_identifier: ministryPayload.icon_identifier,
        })
      }
      setMinistryPayload({ id: null, name: '', icon_identifier: '', username: '', password: '' })
      setMinistryMode('add')
      loadMinistries()
    } catch (e) {
      console.error(e)
      setError(e.message || 'Failed to save ministry')
    }
  }

  const beginEditMinistry = (ministry) => {
    setMinistryMode('edit')
    setMinistryPayload({ id: ministry.id, name: ministry.name, icon_identifier: ministry.icon_identifier || '', username: '', password: '' })
  }

  const handleDeleteMinistry = async (id) => {
    if (!confirm('Delete this ministry? This will affect associated data.')) return
    await adminDeleteMinistry(token, id)
    loadMinistries()
  }

  const handleDeleteUser = async (id) => {
    if (!confirm('Delete this user? This cannot be undone.')) return
    await adminDeleteUser(token, id)
    loadUsers()
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'In Progress': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Resolved': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending': return <FaClock className="w-3 h-3" />
      case 'In Progress': return <FaCog className="w-3 h-3" />
      case 'Resolved': return <FaCheckCircle className="w-3 h-3" />
      default: return <FaFileAlt className="w-3 h-3" />
    }
  }

  const navigationItems = [
    { id: 'overview', label: 'Dashboard', icon: FaTachometerAlt, color: 'text-blue-600' },
    { id: 'ministries', label: 'Ministries', icon: FaBuilding, color: 'text-green-600' },
    { id: 'users', label: 'Users', icon: FaUsers, color: 'text-purple-600' },
    { id: 'vendors', label: 'Vendors', icon: FaUserTie, color: 'text-orange-600' },
    { id: 'logs', label: 'Activity Logs', icon: FaHistory, color: 'text-gray-600' },
    { id: 'profile', label: 'Profile', icon: FaUserCircle, color: 'text-blue-400' },
  ]

  return (
    <div className="flex h-screen bg-gray-50">

      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col h-full">
        <div>
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <FaUserShield className="text-white text-lg" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">Admin Portal</h2>
                <p className="text-sm text-gray-600">CivicTrack Management</p>
              </div>
            </div>
          </div>

          <nav className="p-4">
            <div className="space-y-2">
              {navigationItems.map((item) => {
                const IconComponent = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                      activeTab === item.id
                        ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-600 shadow-sm'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <IconComponent className={`w-5 h-5 mr-3 ${item.color}`} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                )
              })}
            </div>
          </nav>
        </div>
        <div className="mt-auto p-4 border-t border-gray-200 bg-white">
          <button
            onClick={() => {
              setToken('')
              navigate('/')
            }}
            className="w-full flex items-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <FaSignOutAlt className="w-4 h-4 mr-3" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {navigationItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
              </h1>
              <p className="text-gray-600 mt-1">
                Manage and monitor CivicTrack operations
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/admin/analytics')}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
              >
                <FaChartBar className="w-4 h-4 mr-2" />
                Analytics
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <FaBell className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-6">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
              <FaExclamationTriangle className="text-red-500 w-5 h-5 mr-3" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Complaints</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{analytics.total}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FaFileAlt className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending</p>
                      <p className="text-3xl font-bold text-yellow-600 mt-2">{analytics.pending}</p>
                    </div>
                    <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <FaClock className="w-6 h-6 text-yellow-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">In Progress</p>
                      <p className="text-3xl font-bold text-blue-600 mt-2">{analytics.inProgress}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FaCog className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Resolved</p>
                      <p className="text-3xl font-bold text-green-600 mt-2">{analytics.resolved}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <FaCheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Filters and Search */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col lg:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Global Search</label>
                    <div className="relative">
                      <FaSearch className="absolute left-3 top-3 text-gray-400" />
                      <input
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Search complaints by ID, user, or category..."
                        value={globalSearch}
                        onChange={(e) => setGlobalSearch(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                      <select
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                      >
                        <option value="">All Statuses</option>
                        {statuses.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                      <select
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={deptFilter}
                        onChange={(e) => setDeptFilter(e.target.value)}
                      >
                        <option value="">All Departments</option>
                        {departments.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={loadComplaints}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                      >
                        <FaFilter className="w-4 h-4 mr-2" />
                        Refresh
                      </button>
                    </div>
                  </div>
                </div>

                {/* Complaints Table */}
                <div className="overflow-x-auto">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-3 text-gray-600">Loading complaints...</span>
                    </div>
                  ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredComplaints.map(row => (
                          <tr key={row.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {highlightText(String(row.id), debouncedGlobalSearch)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="max-w-xs truncate">
                                {highlightText(row.title || row.description || '�', debouncedGlobalSearch)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(row.status || '�')}`}>
                                {getStatusIcon(row.status || '�')}
                                <span className="ml-1">{highlightText(row.status || '�', debouncedGlobalSearch)}</span>
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {highlightText(row.department || row.ministry_name || row.ministry_id || '�', debouncedGlobalSearch)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                              <button
                                className="inline-flex items-center px-3 py-1 rounded-md text-sm bg-yellow-100 text-yellow-800 hover:bg-yellow-200 transition-colors"
                                onClick={() => onUpdate(row.id, 'In Progress', row.department)}
                              >
                                <FaCog className="w-3 h-3 mr-1" />
                                Progress
                              </button>
                              <button
                                className="inline-flex items-center px-3 py-1 rounded-md text-sm bg-green-100 text-green-800 hover:bg-green-200 transition-colors"
                                onClick={() => onUpdate(row.id, 'Resolved', row.department)}
                              >
                                <FaCheck className="w-3 h-3 mr-1" />
                                Resolve
                              </button>
                              <button
                                className="inline-flex items-center px-3 py-1 rounded-md text-sm bg-red-100 text-red-800 hover:bg-red-200 transition-colors"
                                onClick={() => onReject(row.id)}
                              >
                                <FaTimes className="w-3 h-3 mr-1" />
                                Reject
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ministries' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Ministry Management</h2>
                  <button
                    onClick={() => {
                      setMinistryMode('add')
                      setMinistryPayload({ id: null, name: '', icon_identifier: '', username: '', password: '' })
                    }}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <FaPlus className="w-4 h-4 mr-2" />
                    Add Ministry
                  </button>
                </div>
              </div>

              {/* Add/Edit Form */}
              {(ministryMode === 'add' || ministryMode === 'edit') && (
                <div className="p-6 border-b border-gray-200 bg-gray-50">
                  <form onSubmit={handleMinistrySave} className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Ministry Name</label>
                      <input
                        value={ministryPayload.name}
                        onChange={e => setMinistryPayload(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter ministry name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Icon Identifier</label>
                      <input
                        value={ministryPayload.icon_identifier}
                        onChange={e => setMinistryPayload(prev => ({ ...prev, icon_identifier: e.target.value }))}
                        placeholder="e.g., building, users, cog"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    {ministryMode === 'add' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                          <input
                            type="text"
                            value={ministryPayload.username}
                            onChange={e => setMinistryPayload(prev => ({ ...prev, username: e.target.value }))}
                            placeholder="Ministry username"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required={ministryMode === 'add'}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                          <input
                            type="password"
                            value={ministryPayload.password}
                            onChange={e => setMinistryPayload(prev => ({ ...prev, password: e.target.value }))}
                            placeholder="Ministry password"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required={ministryMode === 'add'}
                          />
                        </div>
                      </>
                    )}
                    <div className="flex items-end space-x-2">
                      <button
                        type="submit"
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                      >
                        <FaCheck className="w-4 h-4 mr-2" />
                        {ministryMode === 'add' ? 'Add Ministry' : 'Save Changes'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMinistryMode('view')
                          setMinistryPayload({ id: null, name: '', icon_identifier: '', username: '', password: '' })
                        }}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        <FaTimes className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Search */}
              <div className="p-6 border-b border-gray-200">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-3 text-gray-400" />
                  <input
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Search ministries..."
                    value={ministrySearch}
                    onChange={(e) => setMinistrySearch(e.target.value)}
                  />
                </div>
              </div>

              {/* Ministries Table */}
              <div className="overflow-x-auto overflow-y-auto h-[55vh] max-h-[70vh]">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Loading ministries...</span>
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Icon</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Password</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredMinistries.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-6 text-gray-400">No data found</td>
                        </tr>
                      ) : (
                        filteredMinistries.map((ministry) => (
                          <tr key={ministry.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {highlightText(ministry.name, debouncedMinistrySearch)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {highlightText(ministry.icon_identifier || '–', debouncedMinistrySearch)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {ministry.ministry_username || '–'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {ministry.ministry_email || '–'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {ministry.ministry_password || 'None'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                              <button
                                onClick={() => beginEditMinistry(ministry)}
                                className="inline-flex items-center px-3 py-1 rounded-md text-sm bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                              >
                                <FaEdit className="w-3 h-3 mr-1" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleResetPassword(ministry)}
                                className="inline-flex items-center px-3 py-1 rounded-md text-sm bg-yellow-100 text-yellow-800 hover:bg-yellow-200 transition-colors"
                              >
                                Reset Password
                              </button>
                              <button
                                onClick={() => handleDeleteMinistry(ministry.id)}
                                className="inline-flex items-center px-3 py-1 rounded-md text-sm bg-red-100 text-red-800 hover:bg-red-200 transition-colors"
                              >
                                <FaTrash className="w-3 h-3 mr-1" />
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
                <p className="text-gray-600 mt-1">View and manage all registered users</p>
                <p className="text-sm text-gray-500 mt-2">Login identifiers are shown as username/email. Passwords are stored securely and are not visible.</p>
              </div>

              <div className="p-6 border-b border-gray-200">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-3 text-gray-400" />
                  <input
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Search users by name, email, username, role, or ID..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="overflow-x-auto max-h-[58vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Loading users...</span>
                  </div>
                ) : (
                  <table className="min-w-[900px] text-xs divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Username</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Password</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Ministry</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Created</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="text-center py-6 text-gray-400">No data found</td>
                        </tr>
                      ) : (
                        filteredUsers.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2 whitespace-nowrap font-medium text-gray-900">{user.id}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-gray-900">{user.name}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-gray-500">{user.username || user.email?.split('@')[0] || '–'}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-gray-500">{user.email}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-gray-500">{user.password || 'None'}</td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                user.role === 'ministry' ? 'bg-green-100 text-green-800' :
                                user.role === 'vendor' ? 'bg-orange-100 text-orange-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-gray-500">{user.ministry_id || '�'}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-gray-500">{new Date(user.created_at).toLocaleDateString()}</td>
                            <td className="px-3 py-2 whitespace-nowrap font-medium space-x-2">
                              <button
                                onClick={() => handleResetPassword(user)}
                                className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-yellow-100 text-yellow-800 hover:bg-yellow-200 transition-colors"
                              >
                                Reset Password
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-red-100 text-red-800 hover:bg-red-200 transition-colors"
                              >
                                <FaTrash className="w-3 h-3 mr-1" />
                                Delete
                              </button>
                              {/* Reset Password Modal */}
                              {resetTarget && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
                                  <form onSubmit={submitResetPassword} className="bg-white rounded-lg shadow-lg p-8 w-full max-w-xs">
                                    <h2 className="text-lg font-bold mb-4">Reset Password for {resetTarget.name || resetTarget.ministry_username}</h2>
                                    <input
                                      ref={resetInputRef}
                                      type="password"
                                      className="w-full px-3 py-2 border border-gray-300 rounded mb-3"
                                      placeholder="New password"
                                      value={resetPassword}
                                      onChange={e => setResetPassword(e.target.value)}
                                      disabled={resetLoading}
                                    />
                                    {resetError && <div className="text-red-600 text-sm mb-2">{resetError}</div>}
                                    <div className="flex gap-2">
                                      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700" disabled={resetLoading}>
                                        {resetLoading ? 'Saving...' : 'Save'}
                                      </button>
                                      <button type="button" className="bg-gray-300 px-4 py-2 rounded" onClick={() => setResetTarget(null)} disabled={resetLoading}>
                                        Cancel
                                      </button>
                                    </div>
                                  </form>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {activeTab === 'profile' && adminProfile && (
            <div className="max-w-xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-2xl font-bold mb-4 flex items-center"><FaUserCircle className="mr-2 text-blue-400" />Admin Profile</h2>
              {profileError && <div className="mb-3 text-red-600">{profileError}</div>}
              {profileSuccess && <div className="mb-3 text-green-600">{profileSuccess}</div>}
              {profileEditing ? (
                <form onSubmit={handleProfileSave} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                      className="mt-1 w-full rounded border p-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                      className="mt-1 w-full rounded border p-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">New Password (leave blank to keep current)</label>
                    <input
                      type="password"
                      value={profileForm.password}
                      onChange={e => setProfileForm({ ...profileForm, password: e.target.value })}
                      className="mt-1 w-full rounded border p-2"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700">Save Changes</button>
                    <button type="button" className="rounded bg-gray-400 px-4 py-2 text-white hover:bg-gray-500" onClick={() => setProfileEditing(false)}>Cancel</button>
                  </div>
                </form>
              ) : (
                <div className="space-y-2">
                  <p><strong>Name:</strong> {adminProfile.name}</p>
                  <p><strong>Email:</strong> {adminProfile.email}</p>
                  <p><strong>Role:</strong> {adminProfile.role}</p>
                  <button className="mt-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700" onClick={() => setProfileEditing(true)}>Edit Profile</button>
                </div>
              )}
            </div>
          )}
          {activeTab === 'vendors' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center"><FaUserTie className="mr-2 text-orange-600" />Vendor Management</h2>
                <p className="text-gray-600 mt-1">View and manage all registered vendors</p>
                <p className="text-sm text-gray-500 mt-2">Details such as Name, Role, Icon, Password, and Action are shown only here for vendors.</p>
              </div>

              {/* Pending Applications Section */}
              <div className="p-6 border-b border-gray-200 bg-yellow-50">
                <h3 className="text-lg font-semibold text-yellow-800 mb-2 flex items-center"><FaClock className="mr-2" />Pending Applications</h3>
                {pendingApplications.length === 0 ? (
                  <div className="text-gray-500">No pending vendor applications.</div>
                ) : (
                  <table className="min-w-full text-xs divide-y divide-gray-200 mb-4">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Company</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pendingApplications.map(app => (
                        <tr key={app.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 whitespace-nowrap">{app.name}</td>
                          <td className="px-3 py-2 whitespace-nowrap">{app.email}</td>
                          <td className="px-3 py-2 whitespace-nowrap">{app.phone}</td>
                          <td className="px-3 py-2 whitespace-nowrap">{app.company}</td>
                          <td className="px-3 py-2 whitespace-nowrap">{app.status}</td>
                          <td className="px-3 py-2 whitespace-nowrap space-x-2">
                            <button
                              className="inline-flex items-center px-3 py-1 rounded-md text-xs bg-green-100 text-green-800 hover:bg-green-200 transition-colors"
                              onClick={async () => {
                                await adminApproveVendorApplication(token, app.id);
                                fetchPendingApplications();
                                fetchVendors();
                              }}
                            >
                              <FaCheck className="w-3 h-3 mr-1" />Accept
                            </button>
                            <button
                              className="inline-flex items-center px-3 py-1 rounded-md text-xs bg-red-100 text-red-800 hover:bg-red-200 transition-colors"
                              onClick={async () => {
                                await adminRejectVendorApplication(token, app.id);
                                fetchPendingApplications();
                              }}
                            >
                              <FaTimes className="w-3 h-3 mr-1" />Reject
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Registered Vendors Table */}
              <div className="overflow-x-auto max-h-[58vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                <table className="min-w-[900px] text-xs divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Username</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Password</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredVendors.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-6 text-gray-400">No data found</td>
                      </tr>
                    ) : (
                      filteredVendors.map((vendor) => (
                        <tr key={vendor.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 whitespace-nowrap font-medium text-gray-900">{vendor.id}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-gray-900">{vendor.name}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-gray-500">{vendor.username || vendor.email?.split('@')[0] || '–'}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-gray-500">{vendor.email}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-gray-500">{vendor.password || 'None'}</td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">vendor</span>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap font-medium space-x-2">
                            <button
                              onClick={() => handleResetPassword(vendor)}
                              className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-yellow-100 text-yellow-800 hover:bg-yellow-200 transition-colors"
                            >
                              Reset Password
                            </button>
                            <button
                              onClick={() => handleDeleteUser(vendor.id)}
                              className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-red-100 text-red-800 hover:bg-red-200 transition-colors"
                            >
                              <FaTrash className="w-3 h-3 mr-1" />Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Activity Logs</h2>
                <p className="text-gray-600 mt-1">Monitor system activities and user actions</p>
              </div>

              <div className="overflow-x-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Loading logs...</span>
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {logs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {log.user_name || 'Unknown'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {log.action}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                            {log.details}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default AdminDashboard;
