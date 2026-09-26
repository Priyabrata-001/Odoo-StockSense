import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { 
  apiGetProductStats, 
  apiGetProducts,
  apiGetCategories,
  apiGetReceipts, 
  apiGetDeliveries, 
  apiGetTransfers,
  apiGetLocationsFull
} from '../utils/api';
import '../styles/app.css';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
  });
  
  const [allProducts, setAllProducts] = useState([]);
  
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
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsData, productsData, receiptsData, deliveriesData, transfersData, warehousesData, categoriesData] = await Promise.all([
        apiGetProductStats(),
        apiGetProducts(),
        apiGetReceipts(),
        apiGetDeliveries(),
        apiGetTransfers(),
        apiGetLocationsFull(),
        apiGetCategories()
      ]);

      setStats(statsData);
      setAllProducts(productsData || []);
      setAllReceipts(receiptsData || []);
      setAllDeliveries(deliveriesData || []);
      setAllTransfers(transfersData || []);
      setWarehousesList(warehousesData || []);
      setCategoriesList(categoriesData || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    }
  };

  const clearFilters = () => {
    setDocType('All Types');
    setStatus('All Statuses');
    setWarehouse('All Warehouses');
    setCategory('All Categories');
  };

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

      {/* Low Stock Section */}
      <div className="dashboard-grid">
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
