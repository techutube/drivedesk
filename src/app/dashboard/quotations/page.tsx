'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Quotation = {
  _id: string;
  quotationNumber: string;
  customer?: { name: string; phone: string };
  car?: { name: string; variant: string };
  salesperson?: { name: string };
  pricing: { finalOnRoadPrice: number };
  status: string;
  createdAt: string;
};

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQuotations = async () => {
    try {
      const res = await fetch('/api/quotations');
      const data = await res.json();
      if (Array.isArray(data)) {
        setQuotations(data);
      }
    } catch (err) {
      console.error('Failed to fetch quotations', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, []);

  const getStatusClass = (status: string) => {
    switch(status) {
      case 'Approved': return 'status-approved';
      case 'Rejected': return 'status-rejected';
      case 'Pending Approval': return 'status-pending';
      default: return 'status-draft';
    }
  };

  return (
    <div className="quotations-page">
      <div className="page-header">
        <h2>Quotations</h2>
        <Link href="/dashboard/quotations/new" className="btn btn-primary">
          + Create Quotation
        </Link>
      </div>

      <div className="card table-card">
        {loading ? (
          <p>Loading quotations...</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Quote No.</th>
                <th>Date</th>
                <th>Customer Name</th>
                <th>Car Model</th>
                <th>Status</th>
                <th>Final Price</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {quotations.map(quote => (
                <tr key={quote._id}>
                  <td><strong>{quote.quotationNumber}</strong></td>
                  <td>{new Date(quote.createdAt).toLocaleDateString()}</td>
                  <td>{quote.customer?.name || 'N/A'}</td>
                  <td>{quote.car ? `${quote.car.name} ${quote.car.variant}` : 'N/A'}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(quote.status)}`}>
                      {quote.status}
                    </span>
                  </td>
                  <td>₹{quote.pricing?.finalOnRoadPrice?.toLocaleString('en-IN') || 0}</td>
                  <td>
                    {quote.status === 'Draft' ? (
                      <Link href={`/dashboard/quotations/${quote._id}/edit`} className="btn btn-sm btn-outline">
                        Edit Draft
                      </Link>
                    ) : (
                      <Link href={`/dashboard/quotations/${quote._id}`} className="btn btn-sm btn-outline">
                        View PDF
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
              {quotations.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center' }}>No quotations found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <style jsx>{`
        .quotations-page {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg);
        }
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .page-header h2 {
          color: var(--text-primary);
          font-weight: 700;
        }
        .card {
          background: white;
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-sm);
          padding: var(--spacing-lg);
          border: 1px solid var(--border-color);
        }
        .admin-table {
          width: 100%;
          border-collapse: collapse;
        }
        .admin-table th, .admin-table td {
          padding: 1rem;
          text-align: left;
          border-bottom: 1px solid var(--border-color);
        }
        .admin-table th {
          font-weight: 600;
          color: var(--text-secondary);
          background-color: var(--bg-color);
        }
        .status-badge {
          padding: 0.25rem 0.5rem;
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          font-weight: 600;
        }
        .status-approved { background: #dcfce7; color: #166534; }
        .status-rejected { background: #fee2e2; color: #991b1b; }
        .status-pending { background: #fef3c7; color: #92400e; }
        .status-draft { background: #f3f4f6; color: #374151; }
      `}</style>
    </div>
  );
}
