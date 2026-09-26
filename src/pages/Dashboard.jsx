import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { 
  getProductStats, 
  getLowStockProducts, 
  getOutOfStockProducts,
  getActivityLog, 
  seedProducts, 
  getReceipts, 
  getDeliveries, 
  getTransfers, 
  getAdjustments, 
  getCategories, 
  getWarehouses,
  getProducts
} from '../utils/inventoryStorage';
import '../styles/app.css';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
  });
  
  const [allProducts, setAllProducts] = useState([]);
  const [allLowStock, setAllLowStock] = useState([]);
  const [allActivity, setAllActivity] = useState([]);
  
  // KPI raw data
  const [allReceipts, setAllReceipts] = useState([]);
  const [allDeliveries, setAllDeliveries] = useState([]);
  const [allTransfers, setAllTransfers] = useState([]);

  // Filter states
  const [docType, setDocType] = useState('All Types');
  const [status, setStatus] = useState('All Statuses');
  const [warehouse, setWarehouse] = useState('All Warehouses');
  const [category, setCategory] = useState('All Categories');

  // Dynamic filter options
  const [warehousesList, setWarehousesList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);

  useEffect(() => {
    seedProducts();
    setStats(getProductStats());
    setAllProducts(getProducts() || []);
    const low = getLowStockProducts() || [];
    const out = getOutOfStockProducts() || [];
    setAllLowStock([...out, ...low]);
    setAllActivity(getActivityLog() || []);
    
    setAllReceipts(getReceipts() || []);
    setAllDeliveries(getDeliveries() || []);
    setAllTransfers(getTransfers() || []);
    
    setWarehousesList(getWarehouses() || []);
    setCategoriesList(getCategories() || []);
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

  const clearFilters = () => {
    setDocType('All Types');
    setStatus('All Statuses');
    setWarehouse('All Warehouses');
    setCategory('All Categories');
  };

  // --- FILTER LOGIC ---
  const filteredActivity = useMemo(() => {
    return allActivity.filter(act => {
      // 1. DocType match
      let actDocType = 'Other';
      if (act.type.includes('receipt')) actDocType = 'Receipt';
      else if (act.type.includes('delivery')) actDocType = 'Delivery';
      else if (act.type.includes('transfer')) actDocType = 'Transfer';
      else if (act.type.includes('adjust')) actDocType = 'Adjustment';
      
      if (docType !== 'All Types' && actDocType !== docType) return false;

      // 2. Status match
      let actStatus = 'Other';
      if (act.type.includes('validated')) actStatus = 'Validated';
      else if (act.type.includes('created')) actStatus = 'Created';
      else if (act.type.includes('picked')) actStatus = 'Picked';
      else if (act.type.includes('packed')) actStatus = 'Packed';
      else if (act.type.includes('pending')) actStatus = 'Pending';
      
      if (status !== 'All Statuses' && actStatus.toLowerCase() !== status.toLowerCase()) return false;

      // 3. Category match (lookup product)
      if (category !== 'All Categories') {
        if (!act.productId) return false;
        const p = allProducts.find(x => x.id === act.productId);
        if (!p || p.category !== category) return false;
      }

      // 4. Warehouse match (heuristic: check description or location data)
      if (warehouse !== 'All Warehouses') {
        // Just checking description text is a viable frontend trick for activity log
        if (!act.description.toLowerCase().includes(warehouse.toLowerCase())) return false;
      }

      return true;
    }).slice(0, 5);
  }, [allActivity, allProducts, docType, status, category, warehouse]);

  const filteredLowStock = useMemo(() => {
    return allProducts.filter(p => {
      if (category !== 'All Categories' && p.category !== category) return false;
      
      const wStock = warehouse !== 'All Warehouses' ? (p.locations?.[warehouse] || 0) : p.currentStock;
      
      if (wStock > p.lowStockThreshold) return false;

      return true;
    }).slice(0, 6);
  }, [allProducts, category, warehouse]);

  const pendingReceipts = useMemo(() => {
    return allReceipts.filter(r => {
      if (r.status !== 'PENDING') return false;
      if (status !== 'All Statuses' && status !== 'Pending') return false;
      if (docType !== 'All Types' && docType !== 'Receipt') return false;
      return true;
    }).length;
  }, [allReceipts, docType, status]);

  const pendingDeliveries = useMemo(() => {
    return allDeliveries.filter(d => {
      if (d.status === 'VALIDATED') return false;
      if (status !== 'All Statuses' && d.status.toLowerCase() !== status.toLowerCase()) return false;
      if (docType !== 'All Types' && docType !== 'Delivery') return false;
      return true;
    }).length;
  }, [allDeliveries, docType, status]);

  const pendingTransfers = useMemo(() => {
    return allTransfers.filter(t => {
      if (t.status !== 'PENDING') return false;
      if (status !== 'All Statuses' && status !== 'Pending') return false;
      if (docType !== 'All Types' && docType !== 'Transfer') return false;
      if (warehouse !== 'All Warehouses' && t.sourceLocation !== warehouse && t.destinationLocation !== warehouse) return false;
      return true;
    }).length;
  }, [allTransfers, docType, status, warehouse]);

  return (
    <AppLayout pageTitle="Dashboard">
      {/* FILTER BAR */}
      <div className="products-toolbar">
        <select value={docType} onChange={e => setDocType(e.target.value)} className="filter-select">
          <option value="All Types">All Types</option>
          <option value="Receipt">Receipt</option>
          <option value="Delivery">Delivery</option>
          <option value="Transfer">Transfer</option>
          <option value="Adjustment">Adjustment</option>
        </select>

        <select value={status} onChange={e => setStatus(e.target.value)} className="filter-select">
          <option value="All Statuses">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Created">Created</option>
          <option value="Picked">Picked</option>
          <option value="Packed">Packed</option>
          <option value="Validated">Validated</option>
        </select>

        <select value={warehouse} onChange={e => setWarehouse(e.target.value)} className="filter-select">
          <option value="All Warehouses">All Warehouses</option>
          {warehousesList.map(w => (
            <option key={w.id} value={w.name}>{w.name}</option>
          ))}
        </select>

        <select value={category} onChange={e => setCategory(e.target.value)} className="filter-select">
          <option value="All Categories">All Categories</option>
          {categoriesList.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <button className="btn-cancel" onClick={clearFilters}>Clear Filters</button>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon products">📦</div>
          <div className="kpi-value">{stats.totalProducts}</div>
          <div className="kpi-label">Total Products</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon low-stock">⚠️</div>
          <div className="kpi-value">{stats.lowStockCount + stats.outOfStockCount}</div>
          <div className="kpi-label">Low / Out of Stock</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon receipts">📥</div>
          <div className="kpi-value">{pendingReceipts}</div>
          <div className="kpi-label">Pending Receipts</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon deliveries">📤</div>
          <div className="kpi-value">{pendingDeliveries}</div>
          <div className="kpi-label">Pending Deliveries</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon transfers">🔄</div>
          <div className="kpi-value">{pendingTransfers}</div>
          <div className="kpi-label">Pending Transfers</div>
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
        <Link to="/receipts" className="quick-action-btn">
          <span className="qa-icon">📥</span> New Receipt
        </Link>
        <Link to="/deliveries" className="quick-action-btn">
          <span className="qa-icon">📤</span> New Delivery
        </Link>
      </div>

      {/* Two-column grid: Activity + Low Stock */}
      <div className="dashboard-grid">
        {/* Recent Activity */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">Recent Activity</h2>
          </div>
          <div className="activity-list">
            {filteredActivity.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No recent activity matches your filters</p>
            ) : (
              filteredActivity.map(activity => (
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
            {filteredLowStock.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>All products well stocked ✅</p>
            ) : (
              filteredLowStock.map(product => {
                const stockToDisplay = warehouse !== 'All Warehouses' ? (product.locations?.[warehouse] || 0) : product.currentStock;
                return (
                  <div key={product.id} className="low-stock-item">
                    <span className="product-name">{product.name}</span>
                    <span className={`stock-badge ${stockToDisplay === 0 ? 'danger' : 'warning'}`}>
                      {stockToDisplay === 0 ? 'Out of Stock' : `${stockToDisplay} ${product.unit}`}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
