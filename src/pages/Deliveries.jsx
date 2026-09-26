import { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import { apiGetDeliveries, apiCreateDelivery, apiUpdateDeliveryStatus, apiGetProducts } from '../utils/api';
import '../styles/app.css';

export default function Deliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ productId: '', quantity: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [deliveriesData, productsData] = await Promise.all([
        apiGetDeliveries(),
        apiGetProducts()
      ]);
      setDeliveries(deliveriesData || []);
      setProducts(productsData || []);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  const handleAddDelivery = () => {
    setFormData({ productId: '', quantity: '' });
    setError('');
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.productId || formData.quantity <= 0) {
      setError('Please select a product and enter a valid quantity');
      return;
    }
    setLoading(true);
    try {
      await apiCreateDelivery({
        productId: formData.productId,
        quantity: parseInt(formData.quantity) || 0
      });
      await loadData();
      handleModalClose();
    } catch (err) {
      setError(err.data?.error || 'Failed to create delivery.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await apiUpdateDeliveryStatus(id, newStatus);
      await loadData();
    } catch (err) {
      alert(err.data?.message || 'Failed to update delivery status.');
    }
  };

  const getProductName = (productId) => {
    const product = products.find(p => p.id === productId);
    return product ? product.name : 'Unknown Product';
  };

  return (
    <AppLayout pageTitle="Delivery Orders">
      <div className="products-toolbar">
        <div></div>
        <button className="add-product-btn" onClick={handleAddDelivery}>
          + New Delivery Order
        </button>
      </div>

      <div className="products-table-container">
        <table className="products-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Product</th>
              <th>Quantity</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {deliveries.map(delivery => (
              <tr key={delivery.id}>
                <td>{new Date(delivery.date).toLocaleDateString()}</td>
                <td>{getProductName(delivery.productId)}</td>
                <td>{delivery.quantity}</td>
                <td>
                  <span className={`status-badge ${delivery.status ? delivery.status.toLowerCase() : ''}`}>
                    {delivery.status}
                  </span>
                </td>
                <td className="table-actions">
                  {delivery.status === 'CREATED' && (
                    <button className="btn-primary" onClick={() => handleStatusUpdate(delivery.id, 'PICKED')}>
                      Mark Picked
                    </button>
                  )}
                  {delivery.status === 'PICKED' && (
                    <button className="btn-primary" onClick={() => handleStatusUpdate(delivery.id, 'PACKED')}>
                      Mark Packed
                    </button>
                  )}
                  {delivery.status === 'PACKED' && (
                    <button className="btn-primary" onClick={() => handleStatusUpdate(delivery.id, 'VALIDATED')}>
                      Validate
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {deliveries.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center' }}>No deliveries found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={handleModalClose}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>New Delivery Order</h2>
              <button className="modal-close" onClick={handleModalClose}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              {error && <div className="error-message" style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
              
              <div className="form-group">
                <label>Product</label>
                <select 
                  value={formData.productId} 
                  onChange={(e) => setFormData({...formData, productId: e.target.value})}
                  required
                  className="form-input"
                >
                  <option value="">Select a product</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} (Stock: {product.currentStock})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Quantity</label>
                <input 
                  type="number" 
                  min="1"
                  value={formData.quantity} 
                  onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || ''})}
                  required
                  className="form-input"
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={handleModalClose}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
