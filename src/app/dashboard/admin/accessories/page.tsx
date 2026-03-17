'use client';

import { useEffect, useState } from 'react';

type Accessory = {
  _id: string;
  name: string;
  price: number;
  category: string;
  applicableModels?: string[];
};

export default function AccessoryManagementPage() {
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', price: 0, category: 'Interior', applicableModels: [] as string[] });
  const [error, setError] = useState('');
  
  // Available car models for filtering
  const [carModels, setCarModels] = useState<string[]>([]);

  const fetchAccessories = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/accessories');
      const data = await res.json();
      if (Array.isArray(data)) {
        setAccessories(data);
      }
    } catch (err) {
      console.error('Failed to fetch accessories', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCarModels = async () => {
    try {
      const res = await fetch('/api/cars');
      const data = await res.json();
      if (Array.isArray(data)) {
        const uniqueModels = Array.from(new Set(data.map((c: any) => c.name))) as string[];
        setCarModels(uniqueModels.sort());
      }
    } catch (err) {
      console.error('Failed to fetch cars', err);
    }
  };

  useEffect(() => {
    fetchAccessories();
    fetchCarModels();
  }, []);

  const handleCreateAccessory = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/accessories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create accessory');
      }
      setShowForm(false);
      setFormData({ name: '', price: 0, category: 'Interior', applicableModels: [] });
      fetchAccessories();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {showForm && (
            <button className="btn btn-outline btn-sm" onClick={() => setShowForm(false)}>
              &larr; Back
            </button>
          )}
          <h2>{showForm ? 'Add New Accessory' : 'Accessories Master'}</h2>
        </div>
        {!showForm && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            + Add New Accessory
          </button>
        )}
      </div>

      {showForm && (
        <div className="card form-card">
          <h3>Add New Accessory</h3>
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleCreateAccessory} className="admin-form">
            <div className="form-group">
              <label>Accessory Name</label>
              <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. 7D Floor Mats" />
            </div>
            <div className="form-group">
              <label>Price (₹)</label>
              <input type="number" required min="0" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
            </div>
            <div className="form-group">
              <label>Category</label>
              <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                <option value="Interior">Interior</option>
                <option value="Exterior">Exterior</option>
                <option value="Electronics">Electronics</option>
                <option value="Safety">Safety</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Applicable Car Models (Leave blank for Universal)</label>
              <select 
                multiple 
                value={formData.applicableModels} 
                onChange={e => {
                  const opts = Array.from(e.target.selectedOptions).map(o => o.value);
                  setFormData({...formData, applicableModels: opts});
                }}
                style={{ height: '120px' }}
              >
                {carModels.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <small>Hold Ctrl (Windows) or Cmd (Mac) to select multiple models.</small>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">Save Accessory</button>
            </div>
          </form>
        </div>
      )}

      <div className="card table-card">
        {loading ? (
          <p>Loading accessories...</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Accessory Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Applicable Cars</th>
              </tr>
            </thead>
            <tbody>
              {accessories.map(acc => (
                <tr key={acc._id}>
                  <td><strong>{acc.name}</strong></td>
                  <td><span className="badge category-badge">{acc.category}</span></td>
                  <td>₹{acc.price.toLocaleString('en-IN')}</td>
                  <td>
                    {(!acc.applicableModels || acc.applicableModels.length === 0) ? (
                      <span className="badge model-badge universal">Universal</span>
                    ) : (
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {acc.applicableModels.map(m => <span key={m} className="badge model-badge">{m}</span>)}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {accessories.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center' }}>No accessories found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

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
          grid-template-columns: 1fr 1fr 1fr;
          gap: var(--spacing-md);
          align-items: end;
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
          display: flex;
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
        .category-badge {
          background-color: #f3f4f6;
          color: #4b5563;
          padding: 0.25rem 0.5rem;
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
        }
        .model-badge {
          background-color: #e0e7ff;
          color: #3730a3;
          padding: 0.2rem 0.4rem;
          border-radius: var(--radius-sm);
          font-size: 0.7rem;
        }
        .model-badge.universal {
          background-color: #dcfce7;
          color: #166534;
        }
        .error-message {
          color: var(--danger);
          background-color: #fef2f2;
          padding: 0.75rem;
          border-radius: var(--radius-sm);
          margin-bottom: var(--spacing-md);
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
}
