import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { getProductStats, getLowStockProducts, getActivityLog, seedProducts } from '../utils/inventoryStorage';
import '../styles/app.css';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
  });
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    seedProducts();
    setStats(getProductStats());
    setLowStockProducts(getLowStockProducts());
    setRecentActivity(getActivityLog(5));
  }, []);

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <AppLayout pageTitle="Dashboard">
      {/* KPI Cards */}
      <div className="kpi-grid">
        {/* Total Products */}
        <div className="kpi-card">
          <div className="kpi-icon products">📦</div>
          <div className="kpi-value">{stats.totalProducts}</div>
          <div className="kpi-label">Total Products</div>
        </div>
        {/* Low / Out of Stock */}
        <div className="kpi-card">
          <div className="kpi-icon low-stock">⚠️</div>
          <div className="kpi-value">{stats.lowStockCount + stats.outOfStockCount}</div>
          <div className="kpi-label">Low / Out of Stock</div>
        </div>
        {/* Pending Receipts */}
        <div className="kpi-card">
          <div className="kpi-icon receipts">📥</div>
          <div className="kpi-value">0</div>
          <div className="kpi-label">Pending Receipts</div>
        </div>
        {/* Pending Deliveries */}
        <div className="kpi-card">
          <div className="kpi-icon deliveries">📤</div>
          <div className="kpi-value">0</div>
          <div className="kpi-label">Pending Deliveries</div>
        </div>
        {/* Internal Transfers */}
        <div className="kpi-card">
          <div className="kpi-icon transfers">🔄</div>
          <div className="kpi-value">0</div>
          <div className="kpi-label">Internal Transfers</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <Link to="/products" className="quick-action-btn">
          <span className="qa-icon">➕</span> Add Product
        </Link>
        <Link to="/products" className="quick-action-btn">
          <span className="qa-icon">📊</span> View Inventory
        </Link>
        <button className="quick-action-btn" disabled title="Coming Soon">
          <span className="qa-icon">📥</span> New Receipt
        </button>
        <button className="quick-action-btn" disabled title="Coming Soon">
          <span className="qa-icon">📤</span> New Delivery
        </button>
      </div>

      {/* Two-column grid: Activity + Low Stock */}
      <div className="dashboard-grid">
        {/* Recent Activity */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">Recent Activity</h2>
          </div>
          <div className="activity-list">
            {recentActivity.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No recent activity</p>
            ) : (
              recentActivity.map(activity => (
                <div key={activity.id} className="activity-item">
                  <div className={`activity-icon ${activity.type.includes('added') ? 'added' : activity.type.includes('deleted') ? 'deleted' : 'updated'}`}>
                    {activity.type.includes('added') ? '➕' : activity.type.includes('deleted') ? '🗑️' : '✏️'}
                  </div>
                  <div className="activity-text">
                    <p>{activity.description}</p>
                    <span>{formatTimeAgo(activity.timestamp)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">Low Stock Alerts</h2>
            <Link to="/products" className="section-action">View All →</Link>
          </div>
          <div className="low-stock-list">
            {lowStockProducts.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>All products well stocked ✅</p>
            ) : (
              lowStockProducts.slice(0, 6).map(product => (
                <div key={product.id} className="low-stock-item">
                  <span className="product-name">{product.name}</span>
                  <span className={`stock-badge ${product.currentStock === 0 ? 'danger' : 'warning'}`}>
                    {product.currentStock === 0 ? 'Out of Stock' : `${product.currentStock} ${product.unit}`}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
