'use client';

import { useEffect, useState } from 'react';

type Customer = {
  _id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  history?: Array<{
    changedBy?: { name: string };
    at: string;
    changes: Record<string, { from: any; to: any }>;
  }>;
  createdAt: string;
};

export default function CustomerManagementPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', address: '', city: '', state: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [historyCust, setHistoryCust] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/customers');
      const data = await res.json();
      if (Array.isArray(data)) {
        setCustomers(data);
      }
    } catch (err) {
      console.error('Failed to fetch customers', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery) ||
    (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleEditClick = (cust: Customer) => {
    setEditingId(cust._id);
    setFormData({
      name: cust.name,
      phone: cust.phone,
      email: cust.email || '',
      address: cust.address || '',
      city: cust.city || '',
      state: cust.state || ''
    });
    setHistoryCust(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ name: '', phone: '', email: '', address: '', city: '', state: '' });
    setShowForm(false);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    const url = editingId ? `/api/customers/${editingId}` : '/api/customers';
    const method = editingId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Failed to ${editingId ? 'update' : 'create'} customer`);
      }
      
      setSuccess(`Customer ${editingId ? 'updated' : 'registered'} successfully!`);
      setTimeout(() => setSuccess(''), 3000);
      
      setShowForm(false);
      setEditingId(null);
      setFormData({ name: '', phone: '', email: '', address: '', city: '', state: '' });
      fetchCustomers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {(showForm || editingId || historyCust) && (
            <button className="btn btn-outline btn-sm" onClick={() => { setHistoryCust(null); handleCancelEdit(); }}>
              &larr; Back
            </button>
          )}
          <h2>{historyCust ? `Change History: ${historyCust.name}` : editingId ? 'Edit Customer' : showForm ? 'Add New Customer' : 'Customer Management'}</h2>
        </div>
        {!showForm && !editingId && !historyCust && (
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="search-box">
              <input 
                type="text" 
                placeholder="Search customers..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              + Add New Customer
            </button>
          </div>
        )}
      </div>

      {showForm && !historyCust && (
        <div className="card form-card">
          <h3>{editingId ? 'Update Customer Details' : 'Register Customer'}</h3>
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          <form onSubmit={handleSubmit} className="admin-form">
            {/* Form fields remain the same */}
            <div className="form-group">
              <label>Full Name *</label>
              <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Rahul Sharma" />
            </div>
            <div className="form-group">
              <label>Phone Number *</label>
              <input type="tel" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="9876543210" />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="Optional" />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Address</label>
              <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Street address" />
            </div>
            <div className="form-group">
              <label>City</label>
              <input type="text" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} placeholder="Mumbai" />
            </div>
            <div className="form-group">
              <label>State</label>
              <input type="text" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} placeholder="Maharashtra" />
            </div>
            <div className="form-actions" style={{ gap: '1rem' }}>
              {editingId && (
                <button type="button" className="btn btn-outline" onClick={handleCancelEdit}>Cancel</button>
              )}
              <button type="submit" className="btn btn-primary">
                {editingId ? 'Update Customer' : 'Save Customer'}
              </button>
            </div>
          </form>
        </div>
      )}

      {historyCust && (
        <div className="card history-card">
          <div className="history-list">
            {(!historyCust.history || historyCust.history.length === 0) ? (
              <p style={{ textAlign: 'center', padding: '2rem' }}>No changes recorded yet.</p>
            ) : (
              historyCust.history.map((entry: any, idx: number) => (
                <div key={idx} className="history-entry">
                  <div className="history-entry-header">
                    <span className="editor-name"><strong>{entry.changedBy?.name || 'System User'}</strong></span>
                    <span className="edit-time">{new Date(entry.at).toLocaleString()}</span>
                  </div>
                  <div className="history-changes">
                    {Object.entries(entry.changes || {}).map(([field, delta]: [any, any]) => (
                      <div key={field} className="change-item">
                        <span className="field-name">{field}:</span>
                        <span className="old-val">{String(delta.from || 'none')}</span>
                        <span className="arrow">&rarr;</span>
                        <span className="new-val">{String(delta.to || 'none')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {!historyCust && (
      <div className="card table-card">
        {loading ? (
          <p>Loading customers...</p>
        ) : (
          <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>City</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map(cust => (
                <tr key={cust._id}>
                  <td><strong>{cust.name}</strong></td>
                  <td>{cust.phone}</td>
                  <td>{cust.email || '-'}</td>
                  <td>{cust.city || '-'}</td>
                  <td style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      className="btn btn-sm btn-outline" 
                      onClick={() => handleEditClick(cust)}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn btn-sm btn-outline" 
                      onClick={() => setHistoryCust(cust)}
                    >
                      History
                    </button>
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center' }}>No customers registered yet.</td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        )}
      </div>
      )}


      <style jsx>{`
        .admin-page {
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
        .form-card h3 {
          margin-bottom: var(--spacing-md);
          color: var(--brand-blue);
        }
        .admin-form {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--spacing-md);
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
        }
        .form-group label {
          font-weight: 600;
          font-size: 0.875rem;
          color: var(--text-secondary);
        }
        .form-group input, .form-group select {
          padding: 0.75rem;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
        }
        .form-group input:focus, .form-group select:focus {
          border-color: var(--brand-blue);
          outline: none;
        }
        .form-actions {
          grid-column: 1 / -1;
          display: flex;
          justify-content: flex-end;
          margin-top: var(--spacing-sm);
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
        .error-message {
          color: var(--danger);
          background-color: #fef2f2;
          padding: 0.75rem;
          border-radius: var(--radius-sm);
          margin-bottom: var(--spacing-md);
          font-size: 0.875rem;
        }
        .table-responsive {
          width: 100%;
          overflow-x: auto;
        }
        .search-input {
          padding: 0.6rem 1rem;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          width: 250px;
          outline: none;
          transition: border-color 0.2s;
        }
        .search-input:focus {
          border-color: var(--brand-blue);
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }
        @media (max-width: 768px) {
          .admin-form {
            grid-template-columns: 1fr;
          }
          .page-header {
            flex-wrap: wrap;
            gap: 0.75rem;
          }
          .admin-table th, .admin-table td {
            padding: 0.6rem;
            font-size: 0.85rem;
          }
        }

        /* History Styles */
        .history-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }
        .history-entry {
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          overflow: hidden;
        }
        .history-entry-header {
          background-color: #f8fafc;
          padding: 0.6rem 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.85rem;
          border-bottom: 1px solid var(--border-color);
        }
        .edit-time {
          color: var(--text-secondary);
        }
        .history-changes {
          padding: 0.75rem 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .change-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
        }
        .field-name {
          font-weight: 600;
          color: var(--text-secondary);
          min-width: 80px;
          text-transform: capitalize;
        }
        .old-val {
          color: var(--danger);
          text-decoration: line-through;
          opacity: 0.7;
        }
        .arrow {
          color: var(--text-secondary);
        }
        .new-val {
          color: #166534;
          font-weight: 500;
        }
        .success-message {
          color: white;
          background-color: #166534;
          padding: 0.75rem;
          border-radius: var(--radius-sm);
          margin-bottom: var(--spacing-md);
          font-size: 0.875rem;
          text-align: center;
        }
      `}</style>
    </div>
  );
}
