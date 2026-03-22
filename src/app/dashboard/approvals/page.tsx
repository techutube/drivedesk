'use client';

import { useEffect, useState } from 'react';

type Quotation = {
  _id: string;
  quotationNumber: string;
  customer?: { name: string; phone: string };
  car?: { name: string; variant: string };
  salesperson?: { _id: string; name: string; email: string; role: string };
  pricing: { 
    finalOnRoadPrice: number;
    discountTotal: number;
  };
  discounts: {
    dealer: number;
    exchangeBonus: number;
    corporate: number;
    festival: number;
    managerSpecial: number;
  };
  status: string;
  managerComments?: string;
  createdAt: string;
};

export default function ApprovalsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuote, setSelectedQuote] = useState<Quotation | null>(null);
  const [comments, setComments] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'Pending Approval' | 'Approved' | 'Rejected'>('Pending Approval');
  const [currentUser, setCurrentUser] = useState<any>(null);

  const fetchPendingQuotations = async () => {
    try {
      setLoading(true);
      const [qRes, uRes] = await Promise.all([
        fetch('/api/quotations'),
        fetch('/api/auth/me')
      ]);
      
      const qData = await qRes.json();
      const uData = await uRes.json();
      
      if (uData.user) setCurrentUser(uData.user);
      if (Array.isArray(qData)) {
        // Filter out Drafts
        const filtered = qData.filter(q => q.status !== 'Draft');
        setQuotations(filtered);
      }
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingQuotations();
  }, []);

  const handleAction = async (status: 'Approved' | 'Rejected') => {
    if (!selectedQuote) return;
    if (status === 'Rejected' && !comments.trim()) {
      alert("Please provide rejection comments.");
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/quotations/${selectedQuote._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, managerComments: comments })
      });
      if (res.ok) {
        setSelectedQuote(null);
        setComments('');
        fetchPendingQuotations();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update status');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating status');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredQuotations = quotations.filter(q => q.status === statusFilter);
  const pendingCount = quotations.filter(q => q.status === 'Pending Approval').length;

  return (
    <div className="approvals-page layout-sidebar-right">
      <div className="main-content">
        <div className="page-header">
          <div>
            <h2>Manager Approvals</h2>
            <span className="badge warning-badge">{pendingCount} Pending Requests</span>
          </div>
          
          <div className="filter-controls">
            <label>Show Quotations:</label>
            <select 
              value={statusFilter} 
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setSelectedQuote(null);
              }}
              className="filter-select"
            >
              <option value="Pending Approval">Pending Approvals</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="card list-card">
          {loading ? (
            <p className="p-4">Loading requests...</p>
          ) : (
            <div className="quotes-list">
              {filteredQuotations.map(quote => (
                <div 
                  key={quote._id} 
                  className={`quote-item ${selectedQuote?._id === quote._id ? 'selected' : ''} ${quote.status === 'Pending Approval' ? 'is-pending' : ''}`}
                  onClick={() => { setSelectedQuote(quote); setComments(quote.managerComments || ''); }}
                >
                  <div className="quote-header">
                    <strong>{quote.quotationNumber}</strong>
                    <span className={`status-pill ${quote.status.replace(/\s+/g, '-').toLowerCase()}`}>
                      {quote.status}
                    </span>
                  </div>
                  <div className="quote-body">
                    <div>
                      <small>Customer</small>
                      <p>{quote.customer?.name || 'Unknown'}</p>
                    </div>
                    <div>
                      <small>Car</small>
                      <p>{quote.car ? `${quote.car.name} ${quote.car.variant}` : 'Unknown'}</p>
                    </div>
                    <div>
                      <small>Total Discounts</small>
                      <p className="text-danger">₹{quote.pricing?.discountTotal?.toLocaleString('en-IN') || 0}</p>
                    </div>
                    <div>
                      <small>Sales Associate</small>
                      <p>{quote.salesperson?.name || 'Self'}</p>
                    </div>
                  </div>
                </div>
              ))}
              {filteredQuotations.length === 0 && (
                <div className="empty-state">No {statusFilter.toLowerCase()} found.</div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="sidebar-review">
        {selectedQuote ? (
          <div className="review-panel card">
            <h3>Review Quotation</h3>
            <p className="quote-id">{selectedQuote.quotationNumber}</p>
            
            <div className="review-section mt-4">
              <h4>Discount Breakdown</h4>
              <ul className="breakdown-list text-danger">
                <li>Dealer Discount: <span>₹{selectedQuote.discounts.dealer.toLocaleString()}</span></li>
                <li>Exchange Bonus: <span>₹{selectedQuote.discounts.exchangeBonus.toLocaleString()}</span></li>
                <li>Corporate: <span>₹{selectedQuote.discounts.corporate.toLocaleString()}</span></li>
                <li>Festival: <span>₹{selectedQuote.discounts.festival.toLocaleString()}</span></li>
                <li>Manager Special: <span>₹{selectedQuote.discounts.managerSpecial.toLocaleString()}</span></li>
                <li className="total">Total Dispensation: <span>₹{selectedQuote.pricing.discountTotal.toLocaleString()}</span></li>
              </ul>
            </div>

            <div className="review-section text-center mt-4">
              <h4>Final Price for Customer</h4>
              <div className="final-price">₹{selectedQuote.pricing.finalOnRoadPrice.toLocaleString('en-IN')}</div>
            </div>

            <div className="review-section mt-4">
              <label>Manager Comments (Required for Rejection)</label>
              <textarea 
                rows={4} 
                className="comments-box" 
                placeholder="Enter feedback for the salesperson..."
                value={comments}
                onChange={e => setComments(e.target.value)}
                disabled={selectedQuote.status !== 'Pending Approval'}
              ></textarea>
            </div>

            {selectedQuote.status === 'Pending Approval' ? (
              <>
                {(() => {
                  const approverRole = currentUser?.role;
                  const creatorRole = selectedQuote.salesperson?.role || 'Sales Associate';
                  const isSelf = selectedQuote.salesperson?._id === (currentUser?.userId || currentUser?._id);
                  const isOwner = approverRole === 'Owner';
                  const isGM = approverRole === 'GM';
                  const isGSM = approverRole === 'GSM';
                  const isSM = approverRole === 'Sales Manager';

                  let canApprove = false;
                  if (creatorRole === 'Sales Associate' || creatorRole === 'Team Lead') {
                    canApprove = isSM || isGSM || isGM || isOwner;
                  } else if (creatorRole === 'Sales Manager') {
                    canApprove = isGSM || isGM;
                  } else if (creatorRole === 'GSM') {
                    canApprove = isGM;
                  } else if (creatorRole === 'GM') {
                    canApprove = isOwner || isSelf;
                  } else if (creatorRole === 'Owner') {
                    canApprove = isOwner && isSelf;
                  }

                  if (canApprove) {
                    return (
                      <div className="action-buttons mt-4">
                        <button 
                          className="btn btn-danger" 
                          onClick={() => handleAction('Rejected')}
                          disabled={actionLoading}
                        >
                          Reject & Return
                        </button>
                        <button 
                          className="btn btn-success" 
                          onClick={() => handleAction('Approved')}
                          disabled={actionLoading}
                        >
                          Approve Quotation
                        </button>
                      </div>
                    );
                  } else {
                    return (
                      <div className="status-message mt-4 info-message">
                        You can only view this quotation. Approvals follow the reporting hierarchy.
                      </div>
                    );
                  }
                })()}
              </>
            ) : (
              <div className="status-message mt-4">
                This quotation has already been {selectedQuote.status.toLowerCase()}.
              </div>
            )}
          </div>
        ) : (
          <div className="review-panel empty card">
            <p>Select a quotation from the list to review details and approve/reject.</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .approvals-page {
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: var(--spacing-lg);
          align-items: start;
        }
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-lg);
        }
        .page-header h2 {
          color: var(--text-primary);
          font-weight: 700;
        }
        .filter-controls {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: #f8fafc;
          padding: 0.5rem 1rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
        }
        .filter-controls label {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-secondary);
        }
        .filter-select {
          padding: 0.4rem 0.75rem;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          font-size: 0.875rem;
          font-weight: 500;
          outline: none;
        }
        .filter-select:focus {
          border-color: var(--brand-blue);
        }
        .badge {
          padding: 0.25rem 0.75rem;
          border-radius: var(--radius-full);
          font-size: 0.875rem;
          font-weight: 600;
        }
        .warning-badge { background: #fef3c7; color: #92400e; }
        
        .card {
          background: white;
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-sm);
          border: 1px solid var(--border-color);
        }
        .list-card {
          overflow: hidden;
        }
        
        .quotes-list {
          display: flex;
          flex-direction: column;
        }
        .quote-item {
          padding: var(--spacing-lg);
          border-bottom: 1px solid var(--border-color);
          cursor: pointer;
          transition: all 0.2s;
        }
        .quote-item:last-child { border-bottom: none; }
        .quote-item:hover { background-color: #f9fafb; }
        .quote-item.selected { 
          background-color: #eff6ff;
          border-left: 4px solid var(--brand-blue);
        }
        .quote-item.is-pending {
          border-left: 4px solid #f59e0b;
        }
        .quote-item.selected.is-pending {
          border-left: 4px solid var(--brand-blue);
        }
        
        .quote-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-md);
        }
        .quote-header strong {
          color: var(--text-primary);
          font-size: 1.125rem;
        }
        
        .status-pill {
          padding: 0.25rem 0.5rem;
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }
        .status-pill.pending-approval { background: #fef3c7; color: #92400e; }
        .status-pill.approved { background: #dcfce7; color: #166534; }
        .status-pill.rejected { background: #fee2e2; color: #991b1b; }
        
        .quote-body {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--spacing-sm);
        }
        .quote-body small {
          color: var(--text-secondary);
          display: block;
          margin-bottom: 0.25rem;
          font-size: 0.75rem;
          text-transform: uppercase;
        }
        .quote-body p {
          color: var(--text-primary);
          font-weight: 500;
          font-size: 0.875rem;
        }
        .text-danger { color: #dc2626 !important; }
        .text-center { text-align: center; }

        .empty-state {
          padding: 3rem;
          text-align: center;
          color: var(--text-secondary);
        }

        /* Sidebar Review */
        .sidebar-review {
          position: sticky;
          top: 2rem;
        }
        .review-panel {
          padding: var(--spacing-xl);
        }
        .review-panel.empty {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          text-align: center;
          color: var(--text-secondary);
        }
        .review-panel h3 {
          color: var(--brand-blue);
          margin-bottom: 0.25rem;
        }
        .quote-id {
          color: var(--text-secondary);
          font-family: monospace;
          font-size: 1rem;
        }
        
        .review-section h4 {
          font-size: 0.875rem;
          color: var(--text-secondary);
          text-transform: uppercase;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .breakdown-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .breakdown-list li {
          display: flex;
          justify-content: space-between;
          padding: 0.25rem 0;
          font-size: 0.875rem;
        }
        .breakdown-list li.total {
          font-weight: 700;
          border-top: 1px dashed #fca5a5;
          margin-top: 0.5rem;
          padding-top: 0.5rem;
          font-size: 1rem;
        }
        
        .final-price {
          font-size: 2.5rem;
          font-weight: 800;
          color: var(--text-primary);
        }

        .comments-box {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          resize: vertical;
          font-family: inherit;
        }
        .comments-box:focus {
          outline: none;
          border-color: var(--brand-blue);
        }

        .action-buttons {
          display: flex;
          gap: 1rem;
        }
        .btn-success { background: #10b981; border: none; flex: 1; }
        .btn-success:hover:not(:disabled) { background: #059669; }
        .btn-danger { background: white; color: #ef4444; border: 1px solid #ef4444; flex: 1; }
        .btn-danger:hover:not(:disabled) { background: #fef2f2; }

        .status-message {
          text-align: center;
          padding: 1rem;
          background: #f9fafb;
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          font-weight: 500;
        }
        .info-message {
          background: #eff6ff;
          color: #1e40af;
          border: 1px solid #bfdbfe;
        }

        @media (max-width: 1024px) {
          .approvals-page {
            grid-template-columns: 1fr;
          }
          .quote-body {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>
    </div>
  );
}
