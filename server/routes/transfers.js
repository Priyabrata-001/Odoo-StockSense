import { Router } from 'express';
import db from '../db.js';

const router = Router();

// GET /api/transfers
router.get('/', (req, res) => {
  const transfers = db.prepare('SELECT * FROM transfers ORDER BY createdAt DESC').all();
  res.json(transfers.map(t => ({
    ...t,
    id: String(t.id),
    productId: String(t.productId),
    date: t.createdAt
  })));
});

// POST /api/transfers
router.post('/', (req, res) => {
  const { productId, quantity, sourceLocation, destinationLocation } = req.body;

  if (!productId || !quantity || !sourceLocation || !destinationLocation) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  if (Number(quantity) <= 0) {
    return res.status(400).json({ error: 'Quantity must be greater than 0.' });
  }
  if (sourceLocation === destinationLocation) {
    return res.status(400).json({ error: 'Source and destination locations cannot be the same.' });
  }

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const result = db.prepare(
    `INSERT INTO transfers (productId, quantity, sourceLocation, destinationLocation, status, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, 'PENDING', datetime('now'), datetime('now'))`
  ).run(productId, Number(quantity), sourceLocation, destinationLocation);

  const transfer = db.prepare('SELECT * FROM transfers WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({
    ...transfer,
    id: String(transfer.id),
    productId: String(transfer.productId),
    date: transfer.createdAt
  });
});

// PUT /api/transfers/:id/validate
router.put('/:id/validate', (req, res) => {
  const validateTransaction = db.transaction(() => {
    const transfer = db.prepare('SELECT * FROM transfers WHERE id = ?').get(req.params.id);
    if (!transfer) throw new Error('Transfer not found');
    if (transfer.status === 'VALIDATED') throw new Error('Already validated');

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(transfer.productId);
    if (!product) throw new Error('Product not found');

    const qty = Number(transfer.quantity);

    // Check source location stock
    const sourceLoc = db.prepare('SELECT * FROM product_locations WHERE productId = ? AND locationName = ?')
      .get(transfer.productId, transfer.sourceLocation);
    const sourceStock = sourceLoc ? sourceLoc.quantity : 0;

    if (sourceStock < qty) {
      throw new Error(`Insufficient stock in ${transfer.sourceLocation}. Available: ${sourceStock}`);
    }

    // Decrease source location
    db.prepare('UPDATE product_locations SET quantity = quantity - ? WHERE productId = ? AND locationName = ?')
      .run(qty, transfer.productId, transfer.sourceLocation);

    // Increase destination location
    const destLoc = db.prepare('SELECT * FROM product_locations WHERE productId = ? AND locationName = ?')
      .get(transfer.productId, transfer.destinationLocation);
    if (destLoc) {
      db.prepare('UPDATE product_locations SET quantity = quantity + ? WHERE productId = ? AND locationName = ?')
        .run(qty, transfer.productId, transfer.destinationLocation);
    } else {
      db.prepare('INSERT INTO product_locations (productId, locationName, quantity) VALUES (?, ?, ?)')
        .run(transfer.productId, transfer.destinationLocation, qty);
    }

    // Total company stock remains unchanged — no update to products.currentStock

    // Update transfer status
    db.prepare(`UPDATE transfers SET status = 'VALIDATED', updatedAt = datetime('now') WHERE id = ?`)
      .run(req.params.id);

    // Record movement
    db.prepare(
      `INSERT INTO stock_movements (productId, type, quantity, source, destination, status, referenceId, referenceType, resultingStock, createdAt)
       VALUES (?, 'Transfer', ?, ?, ?, 'VALIDATED', ?, 'transfer', ?, datetime('now'))`
    ).run(transfer.productId, qty, transfer.sourceLocation, transfer.destinationLocation, transfer.id, product.currentStock);

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
