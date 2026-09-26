import { Router } from 'express';
import db from '../db.js';

const router = Router();

// GET /api/deliveries
router.get('/', (req, res) => {
  const deliveries = db.prepare('SELECT * FROM deliveries ORDER BY createdAt DESC').all();
  res.json(deliveries.map(d => ({
    ...d,
    id: String(d.id),
    productId: String(d.productId),
    date: d.createdAt
  })));
});

// POST /api/deliveries
router.post('/', (req, res) => {
  const { productId, quantity } = req.body;

  if (!productId || !quantity || quantity <= 0) {
    return res.status(400).json({ error: 'Please select a product and enter a valid quantity' });
  }

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const result = db.prepare(
    `INSERT INTO deliveries (productId, quantity, status, createdAt, updatedAt)
     VALUES (?, ?, 'CREATED', datetime('now'), datetime('now'))`
  ).run(productId, Number(quantity));

  const delivery = db.prepare('SELECT * FROM deliveries WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({
    ...delivery,
    id: String(delivery.id),
    productId: String(delivery.productId),
    date: delivery.createdAt
  });
});

// PUT /api/deliveries/:id/status
router.put('/:id/status', (req, res) => {
  const { status } = req.body;
  const validStatuses = ['PICKED', 'PACKED', 'VALIDATED'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }

  const statusUpdate = db.transaction(() => {
    const delivery = db.prepare('SELECT * FROM deliveries WHERE id = ?').get(req.params.id);
    if (!delivery) throw { status: 404, message: 'Delivery not found' };
    if (delivery.status === 'VALIDATED') throw { status: 400, message: 'Already validated' };

    // Enforce flow: CREATED -> PICKED -> PACKED -> VALIDATED
    const expectedPrev = { PICKED: 'CREATED', PACKED: 'PICKED', VALIDATED: 'PACKED' };
    if (delivery.status !== expectedPrev[status]) {
      throw { status: 400, message: `Cannot transition from ${delivery.status} to ${status}` };
    }

    if (status === 'VALIDATED') {
      const product = db.prepare('SELECT * FROM products WHERE id = ?').get(delivery.productId);
      if (!product) throw { status: 404, message: 'Product not found' };

      const qty = Number(delivery.quantity);
      if (product.currentStock < qty) {
        throw { status: 400, message: `Insufficient stock. Available: ${product.currentStock}` };
      }

      // Decrease product stock
      db.prepare(`UPDATE products SET currentStock = currentStock - ?, updatedAt = datetime('now') WHERE id = ?`)
        .run(qty, delivery.productId);

      // Update location stock
      const existing = db.prepare('SELECT * FROM product_locations WHERE productId = ? AND locationName = ?')
        .get(delivery.productId, 'Main Store');
      if (existing) {
        db.prepare('UPDATE product_locations SET quantity = quantity - ? WHERE productId = ? AND locationName = ?')
          .run(qty, delivery.productId, 'Main Store');
      }

      // Get resulting stock
      const updatedProduct = db.prepare('SELECT currentStock FROM products WHERE id = ?').get(delivery.productId);

      // Record movement
      db.prepare(
        `INSERT INTO stock_movements (productId, type, quantity, source, destination, status, referenceId, referenceType, resultingStock, createdAt)
         VALUES (?, 'Delivery', ?, 'Main Store', 'Customer', 'VALIDATED', ?, 'delivery', ?, datetime('now'))`
      ).run(delivery.productId, qty, delivery.id, updatedProduct.currentStock);
    }

    db.prepare(`UPDATE deliveries SET status = ?, updatedAt = datetime('now') WHERE id = ?`)
      .run(status, req.params.id);

    return { success: true };
  });

  try {
    const result = statusUpdate();
    res.json(result);
  } catch (err) {
    const statusCode = err.status || 400;
    res.status(statusCode).json({ success: false, message: err.message });
  }
});

export default router;
