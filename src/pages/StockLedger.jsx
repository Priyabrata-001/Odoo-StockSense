import { useState, useEffect, useMemo } from 'react';
import AppLayout from '../components/AppLayout';
import { apiGetMovements, apiGetLocations } from '../utils/api';
import '../styles/app.css';

export default function StockLedger() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await apiGetMovements();
      setMovements(data || []);
    } catch (err) {
      console.error('Failed to load movements:', err);
    } finally {
      setLoading(false);
    }
  };

  const dynamicLocations = useMemo(() => {
    const locSet = new Set();
    movements.forEach(m => {
      if (m.source && m.source !== '-') locSet.add(m.source);
      if (m.destination && m.destination !== '-') locSet.add(m.destination);
    });
    return Array.from(locSet).sort();
  }, [movements]);

  const filteredMovements = useMemo(() => {
    return movements.filter(m => {
      const searchMatch = m.productName.toLowerCase().includes(search.toLowerCase()) || 
                          m.sku.toLowerCase().includes(search.toLowerCase());
      const typeMatch = typeFilter === 'All' || m.type === typeFilter;
      const locationMatch = locationFilter === 'All' || m.source === locationFilter || m.destination === locationFilter;
      const statusMatch = statusFilter === 'All' || m.status === statusFilter;
      
      return searchMatch && typeMatch && locationMatch && statusMatch;
    });
  }, [movements, search, typeFilter, locationFilter, statusFilter]);

  const clearFilters = () => {
    setSearch('');
    setTypeFilter('All');
    setLocationFilter('All');
    setStatusFilter('All');
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'Receipt': return '#4caf50';
      case 'Delivery': return '#2196f3';
      case 'Transfer': return '#ff9800';
      case 'Adjustment': return '#9c27b0';
      default: return '#757575';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return '#ff9800';
      case 'VALIDATED': return '#4caf50';
      case 'CREATED': return '#9e9e9e';
      case 'PICKED': return '#2196f3';
      case 'PACKED': return '#3f51b5';
      default: return '#757575';
    }
  };

  return (
    <AppLayout pageTitle="Stock Ledger / Move History">
      <div className="products-toolbar">
        <input
          type="text"
          placeholder="Search product or SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="filter-select">
          <option value="All">All Types</option>
          <option value="Receipt">Receipt</option>
          <option value="Delivery">Delivery</option>
          <option value="Transfer">Transfer</option>
          <option value="Adjustment">Adjustment</option>
        </select>
        <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} className="filter-select">
          <option value="All">All Locations</option>
          {dynamicLocations.map(loc => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-select">
          <option value="All">All Statuses</option>
          <option value="PENDING">PENDING</option>
          <option value="VALIDATED">VALIDATED</option>
          <option value="CREATED">CREATED</option>
          <option value="PICKED">PICKED</option>
          <option value="PACKED">PACKED</option>
        </select>
        <button className="btn-secondary" onClick={clearFilters}>Clear Filters</button>
      </div>

      <div className="products-table-container">
        <table className="products-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Product</th>
              <th>SKU</th>
              <th>Type</th>
              <th>Quantity</th>
              <th>Source → Destination</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredMovements.length > 0 ? (
              filteredMovements.map((movement) => (
                <tr key={`${movement.type}-${movement.id}`}>
                  <td>{formatDate(movement.date)}</td>
                  <td>{movement.productName}</td>
                  <td>{movement.sku}</td>
                  <td>
                    <span style={{ 
                      backgroundColor: getTypeColor(movement.type),
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '0.85em',
                      fontWeight: 'bold'
                    }}>
                      {movement.type}
                    </span>
                  </td>
                  <td style={{ 
                    color: movement.quantity.toString().startsWith('+') ? '#4caf50' : 
                           movement.quantity.toString().startsWith('-') ? '#f44336' : 'inherit',
                    fontWeight: 'bold'
                  }}>
                    {movement.quantity}
                  </td>
                  <td>{movement.source} → {movement.destination}</td>
                  <td>
                    <span style={{ 
                      backgroundColor: getStatusColor(movement.status),
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '0.85em',
                      fontWeight: 'bold'
                    }}>
                      {movement.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
                  {loading ? 'Loading...' : 'No movements match your filters'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
}
