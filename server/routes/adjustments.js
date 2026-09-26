import { Router } from 'express';
import db from '../db.js';

const router = Router();

// GET /api/adjustments
router.get('/', (req, res) => {
  const adjustments = db.prepare('SELECT * FROM adjustments ORDER BY createdAt DESC').all();
  res.json(adjustments.map(a => ({
    ...a,
    id: String(a.id),
    productId: String(a.productId),
    date: a.createdAt,
    recordedCount: a.recordedStock
  })));
});

// POST /api/adjustments
router.post('/', (req, res) => {
  const { productId, location, physicalCount, notes } = req.body;

  if (!productId || !location || physicalCount === undefined || physicalCount === null) {
    return res.status(400).json({ success: false, message: 'Please fill in all required fields.' });
  }

  const physical = Number(physicalCount);
  if (isNaN(physical) || physical < 0) {
    return res.status(400).json({ success: false, message: 'Physical count must be a number >= 0.' });
  }

  const adjustTransaction = db.transaction(() => {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
    if (!product) throw new Error('Product not found');

    // Get recorded stock at this location
    const locRow = db.prepare('SELECT * FROM product_locations WHERE productId = ? AND locationName = ?')
      .get(productId, location);
    const recordedStock = locRow ? locRow.quantity : 0;
    const difference = physical - recordedStock;

    if (difference === 0) throw new Error('No difference to adjust');

    // Create adjustment record
    const result = db.prepare(
      `INSERT INTO adjustments (productId, location, recordedStock, physicalCount, difference, notes, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`
    ).run(productId, location, recordedStock, physical, difference, notes || '');

    // Update location stock
    if (locRow) {
      db.prepare('UPDATE product_locations SET quantity = ? WHERE productId = ? AND locationName = ?')
        .run(physical, productId, location);
    } else {
      db.prepare('INSERT INTO product_locations (productId, locationName, quantity) VALUES (?, ?, ?)')
        .run(productId, location, physical);
    }

    // Update total product stock
    db.prepare(`UPDATE products SET currentStock = currentStock + ?, updatedAt = datetime('now') WHERE id = ?`)
      .run(difference, productId);

    // Get resulting stock
    const updatedProduct = db.prepare('SELECT currentStock FROM products WHERE id = ?').get(productId);

    // Record movement
    db.prepare(
      `INSERT INTO stock_movements (productId, type, quantity, source, destination, status, referenceId, referenceType, resultingStock, createdAt)
       VALUES (?, 'Adjustment', ?, '-', ?, 'VALIDATED', ?, 'adjustment', ?, datetime('now'))`
    ).run(productId, difference, location, result.lastInsertRowid, updatedProduct.currentStock);

    return {
      id: String(result.lastInsertRowid),
      productId: String(productId),
      location,
      recordedStock,
      physicalCount: physical,
      difference,
      notes: notes || ''
    };
  });

  try {
    const adjustment = adjustTransaction();
    res.status(201).json({ success: true, adjustment });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET /api/adjustments/recorded-stock?productId=X&location=Y
router.get('/recorded-stock', (req, res) => {
  const { productId, location } = req.query;
  if (!productId || !location) {
    return res.status(400).json({ error: 'productId and location are required' });
  }

  const locRow = db.prepare('SELECT quantity FROM product_locations WHERE productId = ? AND locationName = ?')
    .get(productId, location);
  res.json({ recordedStock: locRow ? locRow.quantity : 0 });
});

export default router;
