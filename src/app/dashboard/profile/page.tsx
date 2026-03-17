'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setStatus('loading');

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage('New password and confirm password do not match.');
      setStatus('error');
      return;
    }

    try {
      const res = await fetch('/api/users/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || 'Failed to update password.');
        setStatus('error');
      } else {
        setMessage('Password updated successfully! Please log in again.');
        setStatus('success');
        setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        // Sign user out after 2 seconds so they log in with new password
        setTimeout(async () => {
          await fetch('/api/auth/logout', { method: 'POST' });
          router.push('/login');
        }, 2000);
      }
    } catch (err) {
      setMessage('An unexpected error occurred. Please try again.');
      setStatus('error');
    }
  };

  return (
    <div className="profile-page">
      <div className="page-header">
        <h2>My Profile</h2>
        <p>Update your account password below.</p>
      </div>

      <div className="card">
        <h3>Change Password</h3>

        {message && (
          <div className={`alert ${status === 'success' ? 'alert-success' : 'alert-error'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label htmlFor="currentPassword">Current Password</label>
            <input
              id="currentPassword"
              type="password"
              required
              placeholder="Enter your current password"
              value={formData.currentPassword}
              onChange={e => setFormData({ ...formData, currentPassword: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              id="newPassword"
              type="password"
              required
              minLength={6}
              placeholder="At least 6 characters"
              value={formData.newPassword}
              onChange={e => setFormData({ ...formData, newPassword: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              id="confirmPassword"
              type="password"
              required
              placeholder="Re-enter your new password"
              value={formData.confirmPassword}
              onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
            />
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={status === 'loading'}
            >
              {status === 'loading' ? 'Updating...' : '🔒 Update Password'}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .profile-page {
          max-width: 540px;
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg);
        }
        .page-header h2 {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .page-header p {
          color: var(--text-secondary);
          margin-top: 4px;
        }
        .card {
          background: white;
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-sm);
          padding: var(--spacing-xl);
          border: 1px solid var(--border-color);
        }
        .card h3 {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--brand-blue);
          margin-bottom: var(--spacing-lg);
          padding-bottom: var(--spacing-md);
          border-bottom: 1px solid var(--border-color);
        }
        .profile-form {
          display: flex;
          flex-direction: column;
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
        .form-group input {
          padding: 0.75rem;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          font-size: 1rem;
          transition: border-color 0.2s;
        }
        .form-group input:focus {
          border-color: var(--brand-blue);
          outline: none;
          box-shadow: 0 0 0 3px rgba(0, 51, 160, 0.1);
        }
        .form-actions {
          margin-top: var(--spacing-sm);
        }
        .alert {
          padding: 0.75rem 1rem;
          border-radius: var(--radius-sm);
          margin-bottom: var(--spacing-md);
          font-size: 0.875rem;
          font-weight: 500;
        }
        .alert-success {
          background-color: #dcfce7;
          color: #166534;
          border: 1px solid #bbf7d0;
        }
        .alert-error {
          background-color: #fef2f2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }
      `}</style>
    </div>
  );
}
