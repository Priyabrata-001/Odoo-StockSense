import { Router } from 'express';
import db from '../db.js';

const router = Router();

// GET /api/products
router.get('/', (req, res) => {
  const { search, category } = req.query;
  let products;

  if (search && category && category !== 'all') {
    const pattern = `%${search}%`;
    products = db.prepare(
      'SELECT * FROM products WHERE (name LIKE ? OR sku LIKE ?) AND category = ? ORDER BY name'
    ).all(pattern, pattern, category);
  } else if (search) {
    const pattern = `%${search}%`;
    products = db.prepare(
      'SELECT * FROM products WHERE name LIKE ? OR sku LIKE ? ORDER BY name'
    ).all(pattern, pattern);
  } else if (category && category !== 'all') {
    products = db.prepare('SELECT * FROM products WHERE category = ? ORDER BY name').all(category);
  } else {
    products = db.prepare('SELECT * FROM products ORDER BY name').all();
  }

  // Attach locations to each product
  const getLocations = db.prepare('SELECT locationName, quantity FROM product_locations WHERE productId = ?');
  products = products.map(p => {
    const locs = getLocations.all(p.id);
    const locations = {};
    locs.forEach(l => { locations[l.locationName] = l.quantity; });
    return { ...p, id: String(p.id), locations };
  });

  res.json(products);
});

// GET /api/products/stats
router.get('/stats', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
  const lowStock = db.prepare('SELECT COUNT(*) as count FROM products WHERE currentStock > 0 AND currentStock <= lowStockThreshold').get().count;
  const outOfStock = db.prepare('SELECT COUNT(*) as count FROM products WHERE currentStock = 0').get().count;

  const categories = db.prepare('SELECT category, COUNT(*) as count FROM products GROUP BY category').all();
  const categoryCounts = {};
  categories.forEach(c => { categoryCounts[c.category] = c.count; });

  res.json({
    totalProducts: total,
    lowStockCount: lowStock,
    outOfStockCount: outOfStock,
    totalValue: 0,
    categoryCounts
  });
});

// GET /api/products/categories
router.get('/categories', (req, res) => {
  const cats = db.prepare('SELECT DISTINCT category FROM products ORDER BY category').all();
  res.json(cats.map(c => c.category));
});

// GET /api/products/low-stock
router.get('/low-stock', (req, res) => {
  const products = db.prepare(
    'SELECT * FROM products WHERE currentStock <= lowStockThreshold AND currentStock > 0 ORDER BY currentStock'
  ).all();
  res.json(products.map(p => ({ ...p, id: String(p.id) })));
});

// GET /api/products/out-of-stock
router.get('/out-of-stock', (req, res) => {
  const products = db.prepare('SELECT * FROM products WHERE currentStock = 0 ORDER BY name').all();
  res.json(products.map(p => ({ ...p, id: String(p.id) })));
});

// GET /api/products/:id
router.get('/:id', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const locs = db.prepare('SELECT locationName, quantity FROM product_locations WHERE productId = ?').all(product.id);
  const locations = {};
  locs.forEach(l => { locations[l.locationName] = l.quantity; });

  res.json({ ...product, id: String(product.id), locations });
});

// POST /api/products
router.post('/', (req, res) => {
  const { name, sku, category, unit, initialStock, lowStockThreshold } = req.body;

  if (!name || !sku) {
    return res.status(400).json({ error: 'Name and SKU are required' });
  }

  const existing = db.prepare('SELECT id FROM products WHERE sku = ?').get(sku);
  if (existing) {
    return res.status(400).json({ error: 'SKU already exists' });
  }

  const stock = initialStock !== undefined ? Number(initialStock) : 0;
  const threshold = lowStockThreshold !== undefined ? Number(lowStockThreshold) : 10;

  const result = db.prepare(
    `INSERT INTO products (name, sku, category, unit, currentStock, lowStockThreshold, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
  ).run(name, sku, category || 'Uncategorized', unit || 'Pcs', stock, threshold);

  // Set initial stock at Main Store
  if (stock > 0) {
    db.prepare('INSERT INTO product_locations (productId, locationName, quantity) VALUES (?, ?, ?)')
      .run(result.lastInsertRowid, 'Main Store', stock);
  }

  const newProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ ...newProduct, id: String(newProduct.id) });
});

// PUT /api/products/:id
router.put('/:id', (req, res) => {
  const { name, sku, category, unit, lowStockThreshold } = req.body;
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  if (sku && sku !== product.sku) {
    const existing = db.prepare('SELECT id FROM products WHERE sku = ? AND id != ?').get(sku, req.params.id);
    if (existing) return res.status(400).json({ error: 'SKU already exists' });
  }

  db.prepare(
    `UPDATE products SET name = ?, sku = ?, category = ?, unit = ?, lowStockThreshold = ?, updatedAt = datetime('now')
     WHERE id = ?`
  ).run(
    name || product.name,
    sku || product.sku,
    category || product.category,
    unit || product.unit,
    lowStockThreshold !== undefined ? Number(lowStockThreshold) : product.lowStockThreshold,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  res.json({ ...updated, id: String(updated.id) });
});

// DELETE /api/products/:id
router.delete('/:id', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  db.prepare('DELETE FROM product_locations WHERE productId = ?').run(req.params.id);
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;
