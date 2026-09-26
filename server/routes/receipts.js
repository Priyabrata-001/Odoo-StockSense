import { Router } from 'express';
import db from '../db.js';

const router = Router();

// GET /api/receipts
router.get('/', (req, res) => {
  const receipts = db.prepare('SELECT * FROM receipts ORDER BY createdAt DESC').all();
  res.json(receipts.map(r => ({
    ...r,
    id: String(r.id),
    productId: String(r.productId),
    date: r.createdAt
  })));
});

// POST /api/receipts
router.post('/', (req, res) => {
  const { supplierName, productId, quantity } = req.body;

  if (!supplierName || !productId || !quantity || quantity <= 0) {
    return res.status(400).json({ error: 'Please fill all fields and ensure quantity is greater than 0.' });
  }

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  // Auto-create supplier if needed
  db.prepare('INSERT OR IGNORE INTO suppliers (name) VALUES (?)').run(supplierName);

  const result = db.prepare(
    `INSERT INTO receipts (supplierName, productId, quantity, status, createdAt, updatedAt)
     VALUES (?, ?, ?, 'PENDING', datetime('now'), datetime('now'))`
  ).run(supplierName, productId, Number(quantity));

  const receipt = db.prepare('SELECT * FROM receipts WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({
    ...receipt,
    id: String(receipt.id),
    productId: String(receipt.productId),
    date: receipt.createdAt
  });
});

// PUT /api/receipts/:id/validate
router.put('/:id/validate', (req, res) => {
  const validateTransaction = db.transaction(() => {
    const receipt = db.prepare('SELECT * FROM receipts WHERE id = ?').get(req.params.id);
    if (!receipt) throw new Error('Receipt not found');
    if (receipt.status === 'VALIDATED') throw new Error('Already validated');

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(receipt.productId);
    if (!product) throw new Error('Product not found');

    const qty = Number(receipt.quantity);

    // Increase product stock
    db.prepare('UPDATE products SET currentStock = currentStock + ?, updatedAt = datetime("now") WHERE id = ?')
      .run(qty, receipt.productId);

    // Update location stock (default: Main Store)
    const existing = db.prepare('SELECT * FROM product_locations WHERE productId = ? AND locationName = ?')
      .get(receipt.productId, 'Main Store');
    if (existing) {
      db.prepare('UPDATE product_locations SET quantity = quantity + ? WHERE productId = ? AND locationName = ?')
        .run(qty, receipt.productId, 'Main Store');
    } else {
      db.prepare('INSERT INTO product_locations (productId, locationName, quantity) VALUES (?, ?, ?)')
        .run(receipt.productId, 'Main Store', qty);
    }

    // Update receipt status
    db.prepare('UPDATE receipts SET status = "VALIDATED", updatedAt = datetime("now") WHERE id = ?')
      .run(req.params.id);

    // Get resulting stock
    const updatedProduct = db.prepare('SELECT currentStock FROM products WHERE id = ?').get(receipt.productId);

    // Record movement
    db.prepare(
      `INSERT INTO stock_movements (productId, type, quantity, source, destination, status, referenceId, referenceType, resultingStock, createdAt)
       VALUES (?, 'Receipt', ?, ?, 'Main Store', 'VALIDATED', ?, 'receipt', ?, datetime('now'))`
    ).run(receipt.productId, qty, receipt.supplierName, receipt.id, updatedProduct.currentStock);

    return true;
  });

  try {
    validateTransaction();
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
