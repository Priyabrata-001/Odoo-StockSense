import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/app.css';

export default function AppLayout({ children, pageTitle }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Close sidebar on mobile when navigating
  const handleNavClick = () => {
    if (isMobile) setSidebarOpen(false);
  };

  const comingSoonItems = [
    { name: 'Receipts', icon: '📥' },
    { name: 'Deliveries', icon: '📤' },
    { name: 'Transfers', icon: '🔄' },
    { name: 'Adjustments', icon: '📋' },
    { name: 'Stock Ledger', icon: '📒' }
  ];

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className={`app-sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
        <div className="sidebar-brand">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
            <line x1="12" y1="22.08" x2="12" y2="12"></line>
          </svg>
          <span>StockSense</span>
        </div>

        <nav className="sidebar-nav">
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={handleNavClick}
          >
            <span className="nav-icon">📊</span> Dashboard
          </NavLink>
          <NavLink
            to="/products"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={handleNavClick}
          >
            <span className="nav-icon">📦</span> Products
          </NavLink>

          <div className="nav-section-label">Coming Soon</div>

          {comingSoonItems.map(item => (
            <div key={item.name} className="nav-item disabled">
              <span className="nav-icon">{item.icon}</span>
              {item.name}
              <span className="coming-soon-badge">Soon</span>
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          v1.0 — Hackathon MVP
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`app-main ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
        {/* Header */}
        <header className="app-header">
          <div className="app-header-left">
            {isMobile && (
              <button
                className="hamburger-btn"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label="Toggle Menu"
              >
                ☰
              </button>
            )}
            <h1>{pageTitle}</h1>
          </div>
          <div className="app-header-right">
            <span className="user-greeting">
              Welcome, {currentUser?.loginId || 'User'}
            </span>
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        {/* Scrollable content */}
        <main className="app-content">
          {children}
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
