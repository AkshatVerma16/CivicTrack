import React, { useState } from 'react';
import axios from 'axios';

export default function BidForm({ complaintId, onBidPlaced }) {
  const [estimatedTime, setEstimatedTime] = useState('');
  const [budget, setBudget] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      await axios.post('/api/bids', {
        complaint_id: complaintId,
        estimated_time: estimatedTime,
        budget,
      });
      setSuccess(true);
      setEstimatedTime('');
      setBudget('');
      if (onBidPlaced) onBidPlaced();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to place bid');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4 border rounded bg-white shadow">
      <h3 className="font-bold text-lg">Request Task (Bid)</h3>
      <div>
        <label className="block">Estimated Time (days):</label>
        <input type="number" min="1" required value={estimatedTime} onChange={e => setEstimatedTime(e.target.value)} className="input input-bordered w-full" />
      </div>
      <div>
        <label className="block">Budget (₹):</label>
        <input type="number" min="1" required value={budget} onChange={e => setBudget(e.target.value)} className="input input-bordered w-full" />
      </div>
      {error && <div className="text-red-500">{error}</div>}
      {success && <div className="text-green-600">Bid placed successfully!</div>}
      <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Submitting...' : 'Submit Bid'}</button>
    </form>
  );
}
