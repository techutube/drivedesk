'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import '@/styles/globals.css';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Handle clicks outside of the profile dropdown
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Fetch the real user session from the API
    fetch('/api/auth/me')
      .then(res => {
        if (!res.ok) throw new Error('Not logged in');
        return res.json();
      })
      .then(data => {
        if (data.user) {
          setUser({ role: data.user.role, name: data.user.name });
        } else {
          router.push('/login');
        }
      })
      .catch(err => {
        router.push('/login');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [router]);

  useEffect(() => {
    // Prevent strictly 'Admin' role users from viewing the default dashboard UI
    if (user?.role === 'Admin' && pathname === '/dashboard') {
      router.push('/dashboard/admin/users');
    }
  }, [user, pathname, router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  if (isLoading) return <div className="loading-screen">Loading...</div>;

  return (
    <div className="dashboard-wrapper">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>DriveDesk</h2>
          <span className="badge">{user?.role}</span>
        </div>
        
        <nav className="sidebar-nav">
          {/* Only show these to non-Admins (Super Admin, Manager, Salesperson) */}
          {user?.role !== 'Admin' && (
            <>
              <Link href="/dashboard" className={`nav-link ${pathname === '/dashboard' ? 'active' : ''}`}>
                Dashboard
              </Link>
              
              {(user?.role === 'Super Admin' || user?.role === 'Manager') && (
                <Link href="/dashboard/approvals" className={`nav-link ${pathname?.includes('/approvals') ? 'active' : ''}`}>
                  Approvals
                </Link>
              )}

              <Link href="/dashboard/customers" className={`nav-link ${pathname?.includes('/customers') ? 'active' : ''}`}>
                Customers
              </Link>

              <Link href="/dashboard/quotations" className={`nav-link ${pathname?.includes('/quotations') ? 'active' : ''}`}>
                Quotations
              </Link>

              <Link href="/dashboard/finance" className={`nav-link ${pathname?.includes('/finance') ? 'active' : ''}`}>
                Finance Calculator
              </Link>
            </>
          )}

          {(user?.role === 'Super Admin' || user?.role === 'Admin') && (
            <>
              <div className="nav-section">Admin Settings</div>
              <Link href="/dashboard/admin/users" className={`nav-link ${pathname?.includes('/admin/users') ? 'active' : ''}`}>
                User Management
              </Link>
              <Link href="/dashboard/admin/inventory" className={`nav-link ${pathname?.includes('/admin/inventory') ? 'active' : ''}`}>
                Cars & Inventory
              </Link>
              <Link href="/dashboard/admin/accessories" className={`nav-link ${pathname?.includes('/admin/accessories') ? 'active' : ''}`}>
                Accessories Master
              </Link>
            </>
          )}
        </nav>

          {/* Removed sidebar footer to avoid duplicate user info and old logout location */}
      </aside>

      <main className="dashboard-main">
        <header className="topbar">
          <div className="page-title">
            <h1>Workspace</h1>
          </div>
          <div className="topbar-actions">
            <div className="user-profile-container" style={{ position: 'relative' }} ref={dropdownRef}>
              <div 
                className="user-profile" 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                style={{ cursor: 'pointer' }}
              >
                <span className="user-name-header">{user?.name}</span>
                <div className="avatar">{user?.name ? user.name.charAt(0).toUpperCase() : 'U'}</div>
              </div>
              
              {isDropdownOpen && (
                <div className="profile-dropdown">
                  <div className="dropdown-header">
                    <p className="dropdown-name">{user?.name}</p>
                    <p className="dropdown-role">{user?.role}</p>
                  </div>
                  <button onClick={handleLogout} className="dropdown-logout">
                    <span style={{ marginRight: '8px' }}>⎋</span> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="content-area">
          {children}
        </div>
      </main>

      <style jsx>{`
        .dashboard-wrapper {
          display: flex;
          height: 100vh;
          background-color: var(--bg-color);
          overflow: hidden;
        }

        .sidebar {
          width: 280px;
          background-color: white;
          border-right: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          box-shadow: var(--shadow-sm);
          z-index: 10;
        }

        .sidebar-header {
          padding: var(--spacing-lg);
          border-bottom: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .sidebar-header h2 {
          color: var(--brand-blue);
          font-weight: 800;
          font-size: 1.25rem;
        }

        .badge {
          background-color: var(--brand-blue-light);
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          font-weight: 600;
        }

        .sidebar-nav {
          flex: 1;
          padding: var(--spacing-md);
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .nav-link {
          display: flex;
          align-items: center;
          padding: 0.75rem 1rem;
          color: var(--text-secondary);
          font-weight: 500;
          border-radius: var(--radius-md);
          transition: all 0.2s ease-in-out;
        }

        .nav-link:hover {
          background-color: #f1f5f9;
          color: var(--brand-blue);
          transform: translateX(4px);
        }

        .nav-link.active {
          background-color: var(--brand-blue);
          color: white;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }

        .nav-section {
          padding: var(--spacing-md) 0.5rem 0.5rem;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-secondary);
          font-weight: 700;
          margin-top: var(--spacing-md);
        }

        .dashboard-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .topbar {
          height: 64px;
          background-color: white;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 var(--spacing-lg);
        }

        .topbar h1 {
          font-size: 1.25rem;
          font-weight: 600;
        }

        .avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background-color: var(--brand-blue);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 0.875rem;
        }
        
        .user-profile {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .user-name-header {
          font-weight: 500;
          color: var(--text-primary);
        }

        .content-area {
          flex: 1;
          overflow-y: auto;
          padding: var(--spacing-xl);
        }

        .profile-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 0.5rem;
          width: 200px;
          background: white;
          border-radius: var(--radius-md);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          border: 1px solid var(--border-color);
          z-index: 50;
          overflow: hidden;
          animation: slideDown 0.2s ease-out;
        }
        
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to {   opacity: 1; transform: translateY(0); }
        }

        .dropdown-header {
          padding: 1rem;
          border-bottom: 1px solid var(--border-color);
          background-color: #f8fafc;
        }

        .dropdown-name {
          font-weight: 600;
          color: var(--text-primary);
          font-size: 0.875rem;
          margin: 0;
        }

        .dropdown-role {
          font-size: 0.75rem;
          color: var(--text-secondary);
          margin: 0;
          margin-top: 2px;
        }

        .dropdown-logout {
          width: 100%;
          display: flex;
          align-items: center;
          padding: 0.75rem 1rem;
          background: none;
          border: none;
          color: var(--danger);
          font-weight: 500;
          font-size: 0.875rem;
          cursor: pointer;
          transition: background-color 0.2s;
          text-align: left;
        }

        .dropdown-logout:hover {
          background-color: #fef2f2;
        }

        .loading-screen {
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          color: var(--brand-blue);
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
