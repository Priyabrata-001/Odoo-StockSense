import { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import { getAdjustments, saveAdjustment, getProducts, getLocations, ensureProductLocations } from '../utils/inventoryStorage';
import '../styles/app.css';

export default function Adjustments() {
  const [adjustments, setAdjustments] = useState([]);
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ productId: '', location: '', physicalCount: '', notes: '' });
  const [recordedStock, setRecordedStock] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setAdjustments(getAdjustments() || []);
    setProducts(getProducts() || []);
    setLocations(getLocations() || []);
  };

  useEffect(() => {
    if (formData.productId && formData.location) {
      const product = products.find(p => p.id === formData.productId);
      if (product) {
        const prodWithLocs = ensureProductLocations(product, locations);
        setRecordedStock(prodWithLocs.locations[formData.location] || 0);
      } else {
        setRecordedStock(0);
      }
    } else {
      setRecordedStock(0);
    }
  }, [formData.productId, formData.location, products, locations]);

  const handleAddAdjustment = () => {
    setFormData({ productId: '', location: '', physicalCount: '', notes: '' });
    setError('');
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.productId || !formData.location || formData.physicalCount === '') {
      setError('Please fill in all required fields.');
      return;
    }

    const physical = parseInt(formData.physicalCount, 10);
    if (isNaN(physical) || physical < 0) {
      setError('Physical count must be a number >= 0.');
      return;
    }

    const result = saveAdjustment({
      ...formData,
      physicalCount: physical
    });

    if (result && result.success === false) {
      setError(result.message || 'Failed to save adjustment.');
    } else {
      loadData();
      setShowModal(false);
    }
  };

  return (
    <AppLayout pageTitle="Inventory Adjustments">
      <div className="products-toolbar">
        <div></div>
        <button className="add-product-btn" onClick={handleAddAdjustment}>
          + New Adjustment
        </button>
      </div>

      <div className="products-table-container">
        <table className="products-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Product</th>
              <th>Location</th>
              <th>Recorded</th>
              <th>Physical</th>
              <th>Diff</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {adjustments.map(adj => {
              const product = products.find(p => p.id === adj.productId);
              const productName = product ? product.name : adj.productId;
              const date = new Date(adj.date).toLocaleString();
              const diff = adj.difference;
              const diffStr = diff > 0 ? `+${diff}` : diff;
              
              return (
                <tr key={adj.id}>
                  <td>{date}</td>
                  <td>{productName}</td>
                  <td>{adj.location}</td>
                  <td>{adj.recordedCount}</td>
                  <td>{adj.physicalCount}</td>
                  <td>{diffStr}</td>
                  <td>{adj.notes}</td>
                </tr>
              );
            })}
            {adjustments.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>No adjustments found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={handleModalClose}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>New Adjustment</h2>
              <button className="modal-close" onClick={handleModalClose}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
              
              <div className="form-group">
                <label>Product *</label>
                <select 
                  value={formData.productId}
                  onChange={e => setFormData({...formData, productId: e.target.value})}
                  required
                >
                  <option value="">Select a product</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (SKU: {p.sku})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Location *</label>
                <select 
                  value={formData.location}
                  onChange={e => setFormData({...formData, location: e.target.value})}
                  required
                >
                  <option value="">Select a location</option>
                  {locations.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Recorded Stock</label>
                <input 
                  type="text" 
                  value={recordedStock} 
                  disabled 
                  style={{ backgroundColor: '#f5f5f5' }}
                />
              </div>

              <div className="form-group">
                <label>Physical Count *</label>
                <input 
                  type="number" 
                  min="0"
                  value={formData.physicalCount}
                  onChange={e => setFormData({...formData, physicalCount: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea 
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                  rows="3"
                ></textarea>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={handleModalClose}>Cancel</button>
                <button type="submit" className="btn-primary">Save Adjustment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
