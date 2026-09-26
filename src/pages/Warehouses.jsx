import { useState, useEffect, useMemo } from 'react';
import AppLayout from '../components/AppLayout';
import { getWarehouses, saveWarehouse, updateWarehouse, getProducts } from '../utils/inventoryStorage';
import '../styles/app.css';

export default function Warehouses() {
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [formData, setFormData] = useState({ id: '', name: '', code: '', location: '', status: 'Active' });
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setWarehouses(getWarehouses() || []);
    setProducts(getProducts() || []);
  };

  const filteredWarehouses = useMemo(() => {
    return warehouses.filter(w => 
      w.name.toLowerCase().includes(search.toLowerCase()) || 
      w.code.toLowerCase().includes(search.toLowerCase())
    );
  }, [warehouses, search]);

  const getStockCount = (warehouseName) => {
    return products.reduce((total, product) => {
      const wStock = product.locations?.[warehouseName] || 0;
      return total + Number(wStock);
    }, 0);
  };

  const handleAddClick = () => {
    setModalMode('add');
    setFormData({ id: '', name: '', code: '', location: '', status: 'Active' });
    setError('');
    setShowModal(true);
  };

  const handleEditClick = (warehouse) => {
    setModalMode('edit');
    setFormData({ ...warehouse });
    setError('');
    setShowModal(true);
  };

  const handleToggleStatus = (warehouse) => {
    const newStatus = warehouse.status === 'Active' ? 'Inactive' : 'Active';
    updateWarehouse(warehouse.id, { ...warehouse, status: newStatus });
    loadData();
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      setError('Name and Code are required.');
      return;
    }
    
    if (modalMode === 'add') {
      saveWarehouse({
        ...formData,
        id: Date.now().toString(),
      });
    } else {
      updateWarehouse(formData.id, formData);
    }
    
    setShowModal(false);
    loadData();
  };

  return (
    <AppLayout pageTitle="Warehouses">
      <div className="products-toolbar">
        <input 
          type="text" 
          placeholder="Search warehouses..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          className="search-input" 
        />
        <button className="add-product-btn btn-primary" onClick={handleAddClick}>+ Add Warehouse</button>
      </div>
      
      <div className="products-table-container">
        <table className="products-table">
          <thead>
            <tr>
              <th>Warehouse Name</th>
              <th>Code</th>
              <th>Location</th>
              <th>Status</th>
              <th>Stock Count</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredWarehouses.map(w => (
              <tr key={w.id}>
                <td>{w.name}</td>
                <td>{w.code}</td>
                <td>{w.location}</td>
                <td>
                  <span className={`status-badge status-${w.status.toLowerCase()}`} style={{
                    padding: '4px 8px', borderRadius: '4px',
                    backgroundColor: w.status === 'Active' ? '#e6f4ea' : '#f8f9fa',
                    color: w.status === 'Active' ? '#1e8e3e' : '#5f6368',
                    fontSize: '0.85em', fontWeight: '500'
                  }}>
                    {w.status}
                  </span>
                </td>
                <td>{getStockCount(w.name)}</td>
                <td className="table-actions">
                  <button className="btn-edit" style={{ marginRight: '8px' }} onClick={() => handleEditClick(w)}>Edit</button>
                  <button className="btn-secondary" onClick={() => handleToggleStatus(w)}>
                    {w.status === 'Active' ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
            {filteredWarehouses.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '1rem' }}>No warehouses found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{modalMode === 'add' ? 'Add Warehouse' : 'Edit Warehouse'}</h2>
            {error && <div className="error-message" style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
            
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Name *</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                />
              </div>
              <div className="form-group">
                <label>Code *</label>
                <input 
                  type="text" 
                  value={formData.code} 
                  onChange={(e) => setFormData({...formData, code: e.target.value})} 
                />
              </div>
              <div className="form-group">
                <label>Location</label>
                <input 
                  type="text" 
                  value={formData.location} 
                  onChange={(e) => setFormData({...formData, location: e.target.value})} 
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select 
                  value={formData.status} 
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="form-control"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              
              <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
