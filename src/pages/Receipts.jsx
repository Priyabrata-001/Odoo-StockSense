import { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import { getReceipts, saveReceipt, validateReceipt, getProducts } from '../utils/inventoryStorage';
import '../styles/app.css';

export default function Receipts() {
  const [receipts, setReceipts] = useState([]);
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ supplierName: '', productId: '', quantity: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setReceipts(getReceipts());
    setProducts(getProducts());
  };

  const handleAddReceipt = () => {
    setFormData({ supplierName: '', productId: '', quantity: '' });
    setError('');
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.supplierName || !formData.productId || !formData.quantity || formData.quantity <= 0) {
      setError('Please fill all fields and ensure quantity is greater than 0.');
      return;
    }

    saveReceipt({
      ...formData,
      quantity: Number(formData.quantity)
    });
    loadData();
    setShowModal(false);
  };

  const handleValidate = (id) => {
    validateReceipt(id);
    loadData();
  };

  const getProductName = (productId) => {
    const product = products.find((p) => p.id === productId);
    return product ? product.name : 'Unknown Product';
  };

  return (
    <AppLayout pageTitle="Receipts">
      <div className="products-toolbar">
        <div></div>
        <button className="add-product-btn" onClick={handleAddReceipt}>
          + New Receipt
        </button>
      </div>

      <div className="products-table-container">
        <table className="products-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Supplier</th>
              <th>Product</th>
              <th>Quantity</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {receipts.map((receipt) => (
              <tr key={receipt.id}>
                <td>{new Date(receipt.date).toLocaleDateString()}</td>
                <td>{receipt.supplierName}</td>
                <td>{getProductName(receipt.productId)}</td>
                <td>{receipt.quantity}</td>
                <td>
                  <span className={`badge badge-${receipt.status === 'PENDING' ? 'warning' : 'success'}`}>
                    {receipt.status}
                  </span>
                </td>
                <td className="table-actions">
                  {receipt.status === 'PENDING' && (
                    <button className="btn-primary" onClick={() => handleValidate(receipt.id)}>
                      Validate
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {receipts.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '1rem' }}>
                  No receipts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={handleModalClose}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>New Receipt</h2>
              <button className="modal-close" onClick={handleModalClose}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              {error && <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
              
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Supplier Name</label>
                <input
                  type="text"
                  value={formData.supplierName}
                  onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                  required
                  style={{ width: '100%', padding: '0.5rem' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Product</label>
                <select
                  value={formData.productId}
                  onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                  required
                  style={{ width: '100%', padding: '0.5rem' }}
                >
                  <option value="">Select a product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  required
                  style={{ width: '100%', padding: '0.5rem' }}
                />
              </div>

              <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn-cancel" onClick={handleModalClose}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
