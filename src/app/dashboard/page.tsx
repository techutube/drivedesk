'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/analytics');
        if (!res.ok) {
          throw new Error('Please log in to view dashboard statistics.');
        }
        const data = await res.json();
        setStats(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="loading">Loading dashboard...</div>;

  return (
    <div className="dashboard-page">
      <div className="welcome-section">
        <h2>Welcome to your Workspace</h2>
        <p className="subtitle">Here is an overview of your current activity.</p>
      </div>

      {error ? (
        <div className="alert alert-warning">
          <p>{error}</p>
          <p>This happens in development if you haven't logged in yet to get a session cookie.</p>
        </div>
      ) : (
        <div className="stats-grid">
          {/* Admin Stats */}
          {stats.totalUsers !== undefined && (
            <>
              <div className="stat-card blue">
                <h3>Total Users</h3>
                <div className="value">{stats.totalUsers}</div>
              </div>
              <div className="stat-card green">
                <h3>Total Cars</h3>
                <div className="value">{stats.totalCars}</div>
              </div>
              <div className="stat-card purple">
                <h3>Total Quotations</h3>
                <div className="value">{stats.totalQuotations}</div>
              </div>
              <div className="stat-card orange">
                <h3>Total Sales Revenue</h3>
                <div className="value">₹{stats.totalSalesRevenue?.toLocaleString('en-IN') || 0}</div>
              </div>
            </>
          )}

          {/* Manager Stats */}
          {stats.totalPending !== undefined && (
            <>
              <div className="stat-card orange">
                <h3>Pending Approvals</h3>
                <div className="value">{stats.totalPending}</div>
              </div>
              <div className="stat-card green">
                <h3>Approved Quotes</h3>
                <div className="value">{stats.totalApproved}</div>
              </div>
              <div className="stat-card red">
                <h3>Rejected Quotes</h3>
                <div className="value">{stats.totalRejected}</div>
              </div>
            </>
          )}

          {/* Sales Associate Stats */}
          {stats.myTotalQuotations !== undefined && (
            <>
              <div className="stat-card blue">
                <h3>My Quotations</h3>
                <div className="value">{stats.myTotalQuotations}</div>
              </div>
              <div className="stat-card orange">
                <h3>Pending Approval</h3>
                <div className="value">{stats.myPending}</div>
              </div>
              <div className="stat-card green">
                <h3>Approved</h3>
                <div className="value">{stats.myApproved}</div>
              </div>
              <div className="stat-card red">
                <h3>Rejected</h3>
                <div className="value">{stats.myRejected}</div>
              </div>
            </>
          )}
        </div>
      )}

      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="actions-grid">
          <Link href="/dashboard/quotations/new" className="action-card">
            <div className="icon">📄</div>
            <h4>Create Quotation</h4>
            <p>Draft a new quotation for a customer.</p>
          </Link>
          <Link href="/dashboard/customers" className="action-card">
            <div className="icon">👥</div>
            <h4>Add Customer</h4>
            <p>Register a new lead or customer.</p>
          </Link>
          <Link href="/dashboard/approvals" className="action-card">
            <div className="icon">✓</div>
            <h4>Review Approvals</h4>
            <p>Managers: Review pending quotes.</p>
          </Link>
        </div>
      </div>

      <style jsx>{`
        .dashboard-page {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xl);
        }
        .welcome-section h2 {
          font-size: 1.5rem;
          color: var(--brand-blue);
          font-weight: 700;
          margin-bottom: 0.5rem;
        }
        .subtitle {
          color: var(--text-secondary);
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: var(--spacing-lg);
        }
        .stat-card {
          background: white;
          padding: var(--spacing-lg);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-sm);
          border-left: 4px solid var(--brand-blue);
        }
        .stat-card.blue { border-left-color: #3b82f6; }
        .stat-card.green { border-left-color: #10b981; }
        .stat-card.purple { border-left-color: #8b5cf6; }
        .stat-card.orange { border-left-color: #f59e0b; }
        .stat-card.red { border-left-color: #ef4444; }
        
        .stat-card h3 {
          font-size: 0.875rem;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: var(--spacing-sm);
        }
        .value {
          font-size: 2rem;
          font-weight: 800;
          color: var(--text-primary);
        }
        
        .quick-actions h3 {
          font-size: 1.25rem;
          margin-bottom: var(--spacing-md);
          color: var(--text-primary);
          font-weight: 700;
        }
        .actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: var(--spacing-lg);
        }
        .action-card {
          background: white;
          padding: var(--spacing-lg);
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
          text-decoration: none;
          color: inherit;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }
        .action-card:hover {
          border-color: var(--brand-blue);
          box-shadow: var(--shadow-md);
          transform: translateY(-2px);
        }
        .icon {
          font-size: 2rem;
          margin-bottom: var(--spacing-xs);
        }
        .action-card h4 {
          color: var(--text-primary);
          font-size: 1.125rem;
          font-weight: 600;
        }
        .action-card p {
          color: var(--text-secondary);
          font-size: 0.875rem;
        }
        .alert {
          padding: var(--spacing-lg);
          border-radius: var(--radius-md);
          background: #fffbeb;
          border: 1px solid #fcd34d;
          color: #92400e;
        }
        .alert p {
          margin-bottom: 0.5rem;
        }
      `}</style>
    </div>
  );
}
