import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function BidsList({ complaintId, canApprove, canReport, onAction }) {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (complaintId) fetchBids();
    // eslint-disable-next-line
  }, [complaintId]);

  const fetchBids = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`/api/bids/${complaintId}`);
      setBids(res.data);
    } catch (e) {
      setError('Failed to load bids');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (bidId) => {
    if (!window.confirm('Approve this bid?')) return;
    try {
      await axios.post(`/api/bids/${bidId}/approve`);
      if (onAction) onAction();
      fetchBids();
    } catch (e) {
      alert('Failed to approve bid');
    }
  };

  const handleReport = async (bidId) => {
    const reason = window.prompt('Reason for reporting this bid? (optional)') || '';
    try {
      await axios.post(`/api/bids/${bidId}/report`, { reason });
      if (onAction) onAction();
      fetchBids();
    } catch (e) {
      alert('Failed to report bid');
    }
  };

  if (loading) return <div>Loading bids...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!bids.length) return <div>No bids yet.</div>;

  // Find lowest bid (cheapest, then fastest)
  const minBudget = Math.min(...bids.map(b => Number(b.budget)));
  const minTime = Math.min(...bids.filter(b => Number(b.budget) === minBudget).map(b => Number(b.estimated_time)));

  return (
    <div className="space-y-2">
      <h4 className="font-semibold">Bids</h4>
      <table className="min-w-full border text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th>Vendor</th>
            <th>Budget (₹)</th>
            <th>Time (days)</th>
            <th>Status</th>
            {canApprove && <th>Approve</th>}
            {canReport && <th>Report</th>}
          </tr>
        </thead>
        <tbody>
          {bids.map(bid => {
            const isLowest = Number(bid.budget) === minBudget && Number(bid.estimated_time) === minTime;
            return (
              <tr key={bid.id} className={isLowest ? 'bg-green-100' : ''}>
                <td>{bid.vendor_name}</td>
                <td>
                  {bid.budget}
                  {isLowest && <span className="ml-2 px-2 py-1 bg-green-500 text-white rounded text-xs">Lowest</span>}
                </td>
                <td>{bid.estimated_time}</td>
                <td>{bid.status}</td>
                {canApprove && <td><button className="btn btn-success btn-xs" disabled={bid.status === 'accepted'} onClick={() => handleApprove(bid.id)}>Approve</button></td>}
                {canReport && <td><button className="btn btn-warning btn-xs" onClick={() => handleReport(bid.id)}>Report to Admin</button></td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
