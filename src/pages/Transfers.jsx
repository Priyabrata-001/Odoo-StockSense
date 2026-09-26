import { useState, useEffect } from 'react'
import AppLayout from '../components/AppLayout'
import { apiGetTransfers, apiCreateTransfer, apiValidateTransfer, apiGetProducts, apiGetLocations } from '../utils/api'
import '../styles/app.css'

export default function Transfers() {
  const [transfers, setTransfers] = useState([]);
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ productId: '', quantity: '', sourceLocation: '', destinationLocation: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      const [transfersData, productsData, locationsData] = await Promise.all([
        apiGetTransfers(),
        apiGetProducts(),
        apiGetLocations()
      ]);
      setTransfers(transfersData || []);
      setProducts(productsData || []);
      setLocations(locationsData || []);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddTransfer = () => {
    setFormData({ productId: '', quantity: '', sourceLocation: '', destinationLocation: '' });
    setError('');
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const { productId, quantity, sourceLocation, destinationLocation } = formData;
    
    if (!productId || !quantity || !sourceLocation || !destinationLocation) {
      setError('All fields are required.');
      return;
    }
    
    if (Number(quantity) <= 0) {
      setError('Quantity must be greater than 0.');
      return;
    }

    if (sourceLocation === destinationLocation) {
      setError('Source and destination locations cannot be the same.');
      return;
    }

    setLoading(true);
    try {
      await apiCreateTransfer({
        ...formData,
        quantity: Number(quantity)
      });
      await loadData();
      setShowModal(false);
    } catch (err) {
      setError(err.data?.error || 'Failed to create transfer.');
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async (id) => {
    try {
      await apiValidateTransfer(id);
      await loadData();
    } catch (err) {
      window.alert(err.data?.message || 'Failed to validate transfer.');
    }
  };

  return (
    <AppLayout pageTitle="Internal Transfers">
      <div className="products-toolbar">
        <div></div>
        <button className="add-product-btn" onClick={handleAddTransfer}>
          + New Transfer
        </button>
      </div>

      <div className="products-table-container">
        <table className="products-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Product</th>
              <th>Quantity</th>
              <th>From</th>
              <th>To</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {transfers.map(transfer => {
              const product = products.find(p => p.id === transfer.productId);
              return (
                <tr key={transfer.id}>
                  <td>{transfer.date ? new Date(transfer.date).toLocaleDateString() : 'N/A'}</td>
                  <td>{product ? product.name : 'Unknown Product'}</td>
                  <td>{transfer.quantity}</td>
                  <td>{transfer.sourceLocation}</td>
                  <td>{transfer.destinationLocation}</td>
                  <td>
                    <span className={`status-badge ${transfer.status === 'PENDING' ? 'warning' : 'success'}`}>
                      {transfer.status || 'PENDING'}
                    </span>
                  </td>
                  <td>
                    {(!transfer.status || transfer.status === 'PENDING') && (
                      <button className="btn-primary" onClick={() => handleValidate(transfer.id)}>
                        Validate
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {transfers.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '1rem' }}>No transfers found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={handleModalClose}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>New Transfer</h2>
              <button className="modal-close" onClick={handleModalClose}>×</button>
            </div>
            
            {error && <div className="error-message" style={{ color: 'red', margin: '10px 0' }}>{error}</div>}
            
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Product</label>
                <select 
                  value={formData.productId} 
                  onChange={e => setFormData({...formData, productId: e.target.value})}
                  required
                >
                  <option value="">Select a product...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Stock: {p.currentStock})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Source Location</label>
                <select 
                  value={formData.sourceLocation} 
                  onChange={e => setFormData({...formData, sourceLocation: e.target.value})}
                  required
                >
                  <option value="">Select source...</option>
                  {locations.map((l, i) => {
                    const val = typeof l === 'string' ? l : l.id || l.name;
                    const label = typeof l === 'string' ? l : l.name || l.id;
                    return <option key={val || i} value={val}>{label}</option>
                  })}
                </select>
              </div>

              <div className="form-group">
                <label>Destination Location</label>
                <select 
                  value={formData.destinationLocation} 
                  onChange={e => setFormData({...formData, destinationLocation: e.target.value})}
                  required
                >
                  <option value="">Select destination...</option>
                  {locations.map((l, i) => {
                    const val = typeof l === 'string' ? l : l.id || l.name;
                    const label = typeof l === 'string' ? l : l.name || l.id;
                    return <option key={val || i} value={val}>{label}</option>
                  })}
                </select>
              </div>

              <div className="form-group">
                <label>Quantity</label>
                <input 
                  type="number" 
                  min="1"
                  value={formData.quantity} 
                  onChange={e => setFormData({...formData, quantity: e.target.value})}
                  required
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={handleModalClose}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
