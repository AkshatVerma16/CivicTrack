import React, { useEffect, useState } from 'react';
import axios from 'axios';
import BidForm from '../components/BidForm';
import BidsList from '../components/BidsList';

export default function VendorBiddingPage({ complaintId }) {
  const [showBids, setShowBids] = useState(false);

  return (
    <div className="max-w-xl mx-auto mt-8">
      <BidForm complaintId={complaintId} onBidPlaced={() => setShowBids(true)} />
      <button className="btn btn-link mt-4" onClick={() => setShowBids((v) => !v)}>
        {showBids ? 'Hide Bids' : 'View All Bids'}
      </button>
      {showBids && <BidsList complaintId={complaintId} canApprove={false} canReport={false} />}
    </div>
  );
}
