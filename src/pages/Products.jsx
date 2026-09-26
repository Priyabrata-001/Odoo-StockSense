import { useState, useEffect, useCallback } from 'react';
import AppLayout from '../components/AppLayout';
import ProductModal from '../components/ProductModal';
import { apiGetProducts, apiDeleteProduct, apiGetCategories } from '../utils/api';
import '../styles/app.css';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState(null);

  const loadProducts = useCallback(async () => {
    try {
      const data = await apiGetProducts(searchQuery, selectedCategory);
      setProducts(data || []);
    } catch (err) {
      console.error('Failed to load products:', err);
    }
  }, [searchQuery, selectedCategory]);

  const loadCategories = async () => {
    try {
      const cats = await apiGetCategories();
      setCategories(cats || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowModal(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    loadProducts();
    loadCategories();
  };

  const handleDeleteClick = (product) => {
    setDeletingProduct(product);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (deletingProduct) {
      try {
        await apiDeleteProduct(deletingProduct.id);
        await loadProducts();
        await loadCategories();
      } catch (err) {
        console.error('Failed to delete product:', err);
      }
    }
    setShowDeleteConfirm(false);
    setDeletingProduct(null);
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setDeletingProduct(null);
  };

  return (
    <AppLayout pageTitle="Products">
      {/* Toolbar */}
      <div className="products-toolbar">
        <div className="products-search">
          <input
            className="search-input"
            type="text"
            placeholder="Search by name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="products-filters">
          <select
            className="filter-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <button className="add-product-btn" onClick={handleAddProduct}>
            + Add Product
          </button>
        </div>
      </div>

      {/* Products Table */}
      {products.length === 0 ? (
        <div className="empty-products">
          <div className="empty-icon">📦</div>
          <h3>{searchQuery || selectedCategory !== 'all' ? 'No products match your filters' : 'No products yet'}</h3>
          <p>{searchQuery || selectedCategory !== 'all' ? 'Try adjusting your search or filters' : 'Add your first product to get started'}</p>
        </div>
      ) : (
        <div className="products-table-container">
          <table className="products-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Unit</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id}>
                  <td style={{ fontWeight: 500 }}>{product.name}</td>
                  <td><span className="product-sku">{product.sku}</span></td>
                  <td><span className="product-category">{product.category}</span></td>
                  <td>{product.unit}</td>
                  <td style={{ fontWeight: 600 }}>{product.currentStock}</td>
                  <td>
                    <span className={`stock-badge ${product.currentStock === 0 ? 'danger' : product.currentStock <= product.lowStockThreshold ? 'warning' : 'success'}`}>
                      {product.currentStock === 0 ? 'Out of Stock' : product.currentStock <= product.lowStockThreshold ? 'Low Stock' : 'In Stock'}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="table-action-btn" onClick={() => handleEditProduct(product)}>Edit</button>
                      <button className="table-action-btn delete" onClick={() => handleDeleteClick(product)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Product Modal */}
      {showModal && (
        <ProductModal
          product={editingProduct}
          onClose={handleModalClose}
        />
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && deletingProduct && (
        <div className="confirm-overlay" onClick={handleDeleteCancel}>
          <div className="confirm-content" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon">🗑️</div>
            <h3>Delete Product</h3>
            <p>Are you sure you want to delete "{deletingProduct.name}"? This action cannot be undone.</p>
            <div className="confirm-actions">
              <button className="btn-cancel" onClick={handleDeleteCancel}>Cancel</button>
              <button className="btn-danger" onClick={handleDeleteConfirm}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
