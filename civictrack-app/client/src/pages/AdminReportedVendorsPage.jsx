import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function AdminReportedVendorsPage() {
  const [reported, setReported] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReported();
  }, []);

  const fetchReported = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/api/bids/reported/all');
      setReported(res.data);
    } catch (e) {
      setError('Failed to load reported vendors');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVendor = async (vendorId) => {
    if (!window.confirm('Delete this vendor and all their bids?')) return;
    try {
      await axios.delete(`/api/bids/vendor/${vendorId}`);
      fetchReported();
    } catch (e) {
      alert('Failed to delete vendor');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="max-w-3xl mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4">Reported Vendors</h2>
      {reported.length === 0 ? (
        <div>No reported vendors.</div>
      ) : (
        <table className="min-w-full border text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th>Vendor</th>
              <th>Email</th>
              <th>Bid (₹)</th>
              <th>Time (days)</th>
              <th>Reason</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {reported.map((r) => (
              <tr key={r.id}>
                <td>{r.vendor_name}</td>
                <td>{r.vendor_email}</td>
                <td>{r.budget}</td>
                <td>{r.estimated_time}</td>
                <td>{r.reason}</td>
                <td>
                  <button className="btn btn-danger btn-xs" onClick={() => handleDeleteVendor(r.vendor_id)}>
                    Delete Vendor
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
