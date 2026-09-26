import { useState } from 'react';
import { saveProduct, updateProduct, getProductBySku } from '../utils/inventoryStorage';

export default function ProductModal({ product, onClose }) {
  const categories = ['Electronics', 'Office Supplies', 'Furniture', 'Packaging', 'Raw Materials', 'Safety Equipment', 'Tools', 'Other'];
  const units = ['Pcs', 'Kg', 'Ltr', 'Box', 'Pair', 'Set', 'Roll', 'Pack', 'Meter', 'Other'];

  const [formData, setFormData] = useState({
    name: product?.name || '',
    sku: product?.sku || '',
    category: product?.category || '',
    unit: product?.unit || 'Pcs',
    initialStock: product?.initialStock ?? 0,
    lowStockThreshold: product?.lowStockThreshold ?? 10
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name || formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    if (!formData.sku || formData.sku.trim().length < 3) {
      newErrors.sku = 'SKU must be at least 3 characters';
    }
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    if (!formData.unit) {
      newErrors.unit = 'Unit is required';
    }
    if (!product && (formData.initialStock === '' || Number(formData.initialStock) < 0)) {
      newErrors.initialStock = 'Initial stock must be >= 0';
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      const existingProduct = getProductBySku(formData.sku.trim());
      if (existingProduct && (!product || existingProduct.id !== product.id)) {
        setErrors({ sku: 'SKU must be unique' });
        setLoading(false);
        return;
      }

      if (product) {
        updateProduct(product.id, {
          name: formData.name.trim(),
          sku: formData.sku.trim(),
          category: formData.category,
          unit: formData.unit,
          lowStockThreshold: Number(formData.lowStockThreshold) || 0
        });
      } else {
        const initialStockNum = Number(formData.initialStock);
        saveProduct({
          name: formData.name.trim(),
          sku: formData.sku.trim(),
          category: formData.category,
          unit: formData.unit,
          initialStock: initialStockNum,
          currentStock: initialStockNum,
          lowStockThreshold: Number(formData.lowStockThreshold) || 0
        });
      }
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{product ? 'Edit Product' : 'Add New Product'}</h2>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          {/* Product Name */}
          <div className="form-group">
            <label className="form-label">Product Name</label>
            <input 
              className={`form-input ${errors.name ? 'error' : ''}`}
              type="text" 
              name="name"
              placeholder="Enter product name"
              value={formData.name} 
              onChange={handleChange} 
            />
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>

          {/* SKU */}
          <div className="form-group">
            <label className="form-label">SKU / Product Code</label>
            <input 
              className={`form-input ${errors.sku ? 'error' : ''}`}
              type="text" 
              name="sku"
              placeholder="e.g. ELEC-001"
              value={formData.sku} 
              onChange={handleChange} 
            />
            {errors.sku && <span className="form-error">{errors.sku}</span>}
          </div>

          {/* Category */}
          <div className="form-group">
            <label className="form-label">Category</label>
            <select 
              className={`form-input ${errors.category ? 'error' : ''}`}
              name="category"
              value={formData.category} 
              onChange={handleChange}
            >
              <option value="">Select Category</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.category && <span className="form-error">{errors.category}</span>}
          </div>

          {/* Unit */}
          <div className="form-group">
            <label className="form-label">Unit</label>
            <select 
              className={`form-input ${errors.unit ? 'error' : ''}`}
              name="unit"
              value={formData.unit} 
              onChange={handleChange}
            >
              <option value="">Select Unit</option>
              {units.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
            {errors.unit && <span className="form-error">{errors.unit}</span>}
          </div>

          {/* Initial Stock */}
          {!product && (
            <div className="form-group">
              <label className="form-label">Initial Stock</label>
              <input 
                className={`form-input ${errors.initialStock ? 'error' : ''}`}
                type="number" 
                name="initialStock"
                min="0" 
                placeholder="0"
                value={formData.initialStock} 
                onChange={handleChange} 
              />
              {errors.initialStock && <span className="form-error">{errors.initialStock}</span>}
            </div>
          )}

          {/* Low Stock Threshold */}
          <div className="form-group">
            <label className="form-label">Low Stock Threshold</label>
            <input 
              className="form-input"
              type="number" 
              name="lowStockThreshold"
              min="0" 
              placeholder="10"
              value={formData.lowStockThreshold} 
              onChange={handleChange} 
            />
          </div>

          {/* Buttons */}
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : product ? 'Update Product' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
