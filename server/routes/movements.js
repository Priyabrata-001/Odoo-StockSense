import { Router } from 'express';
import db from '../db.js';

const router = Router();

// GET /api/movements
router.get('/', (req, res) => {
  const movements = db.prepare(`
    SELECT sm.*, p.name as productName, p.sku
    FROM stock_movements sm
    LEFT JOIN products p ON sm.productId = p.id
    ORDER BY sm.createdAt DESC
  `).all();

  // Also include non-validated receipts/deliveries/transfers for full ledger view
  const receipts = db.prepare(`
    SELECT r.id, r.productId, r.quantity, r.status, r.createdAt, r.supplierName,
           p.name as productName, p.sku
    FROM receipts r
    LEFT JOIN products p ON r.productId = p.id
    ORDER BY r.createdAt DESC
  `).all();

  const deliveries = db.prepare(`
    SELECT d.id, d.productId, d.quantity, d.status, d.createdAt,
           p.name as productName, p.sku
    FROM deliveries d
    LEFT JOIN products p ON d.productId = p.id
    ORDER BY d.createdAt DESC
  `).all();

  const transfers = db.prepare(`
    SELECT t.id, t.productId, t.quantity, t.status, t.createdAt,
           t.sourceLocation, t.destinationLocation,
           p.name as productName, p.sku
    FROM transfers t
    LEFT JOIN products p ON t.productId = p.id
    ORDER BY t.createdAt DESC
  `).all();

  const adjustments = db.prepare(`
    SELECT a.id, a.productId, a.difference, a.location, a.createdAt,
           p.name as productName, p.sku
    FROM adjustments a
    LEFT JOIN products p ON a.productId = p.id
    ORDER BY a.createdAt DESC
  `).all();

  // Build combined movement list for the stock ledger
  const allMovements = [];

  receipts.forEach(r => {
    allMovements.push({
      id: String(r.id),
      date: r.createdAt,
      type: 'Receipt',
      productId: String(r.productId),
      productName: r.productName || 'Unknown',
      sku: r.sku || 'Unknown',
      quantity: `+${r.quantity}`,
      source: r.supplierName,
      destination: 'Main Store',
      status: r.status,
      rawDate: r.createdAt
    });
  });

  deliveries.forEach(d => {
    allMovements.push({
      id: String(d.id),
      date: d.createdAt,
      type: 'Delivery',
      productId: String(d.productId),
      productName: d.productName || 'Unknown',
      sku: d.sku || 'Unknown',
      quantity: `-${d.quantity}`,
      source: 'Main Store',
      destination: 'Customer',
      status: d.status,
      rawDate: d.createdAt
    });
  });

  transfers.forEach(t => {
    allMovements.push({
      id: String(t.id),
      date: t.createdAt,
      type: 'Transfer',
      productId: String(t.productId),
      productName: t.productName || 'Unknown',
      sku: t.sku || 'Unknown',
      quantity: String(t.quantity),
      source: t.sourceLocation,
      destination: t.destinationLocation,
      status: t.status,
      rawDate: t.createdAt
    });
  });

  adjustments.forEach(a => {
    allMovements.push({
      id: String(a.id),
      date: a.createdAt,
      type: 'Adjustment',
      productId: String(a.productId),
      productName: a.productName || 'Unknown',
      sku: a.sku || 'Unknown',
      quantity: a.difference > 0 ? `+${a.difference}` : String(a.difference),
      source: '-',
      destination: a.location,
      status: 'VALIDATED',
      rawDate: a.createdAt
    });
  });

  // Sort by date descending
  allMovements.sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate));

  res.json(allMovements);
});

export default router;
