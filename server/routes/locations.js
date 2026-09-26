import { Router } from 'express';
import db from '../db.js';

const router = Router();

// GET /api/locations
router.get('/', (req, res) => {
  const locations = db.prepare('SELECT * FROM locations ORDER BY name').all();
  res.json(locations.map(l => l.name));
});

// GET /api/locations/full
router.get('/full', (req, res) => {
  const locations = db.prepare('SELECT * FROM locations ORDER BY name').all();
  res.json(locations.map(l => ({ ...l, id: String(l.id) })));
});

// POST /api/locations
router.post('/', (req, res) => {
  const { name, code, address, status } = req.body;
  if (!name) return res.status(400).json({ error: 'Location name is required' });

  const existing = db.prepare('SELECT id FROM locations WHERE name = ?').get(name);
  if (existing) return res.status(400).json({ error: 'Location already exists' });

  const result = db.prepare(
    `INSERT INTO locations (name, code, address, status, createdAt) VALUES (?, ?, ?, ?, datetime('now'))`
  ).run(name, code || '', address || '', status || 'Active');

  const loc = db.prepare('SELECT * FROM locations WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ ...loc, id: String(loc.id) });
});

// PUT /api/locations/:id
router.put('/:id', (req, res) => {
  const { name, code, address, status } = req.body;
  const loc = db.prepare('SELECT * FROM locations WHERE id = ?').get(req.params.id);
  if (!loc) return res.status(404).json({ error: 'Location not found' });

  db.prepare('UPDATE locations SET name = ?, code = ?, address = ?, status = ? WHERE id = ?')
    .run(name || loc.name, code !== undefined ? code : loc.code, address !== undefined ? address : loc.address, status || loc.status, req.params.id);

  const updated = db.prepare('SELECT * FROM locations WHERE id = ?').get(req.params.id);
  res.json({ ...updated, id: String(updated.id) });
});

export default router;
