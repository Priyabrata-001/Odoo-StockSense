import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'stocksense.db');

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ==========================================
// SCHEMA
// ==========================================

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    loginId TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    sku TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL DEFAULT 'Uncategorized',
    unit TEXT NOT NULL DEFAULT 'Pcs',
    currentStock INTEGER NOT NULL DEFAULT 0,
    lowStockThreshold INTEGER NOT NULL DEFAULT 10,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    code TEXT,
    address TEXT,
    status TEXT NOT NULL DEFAULT 'Active',
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS product_locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    productId INTEGER NOT NULL,
    locationName TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE(productId, locationName)
  );

  CREATE TABLE IF NOT EXISTS receipts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    supplierName TEXT NOT NULL,
    productId INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (productId) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS deliveries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    productId INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'CREATED',
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (productId) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS transfers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    productId INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    sourceLocation TEXT NOT NULL,
    destinationLocation TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (productId) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS adjustments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    productId INTEGER NOT NULL,
    location TEXT NOT NULL,
    recordedStock INTEGER NOT NULL,
    physicalCount INTEGER NOT NULL,
    difference INTEGER NOT NULL,
    notes TEXT,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (productId) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS stock_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    productId INTEGER NOT NULL,
    type TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    source TEXT,
    destination TEXT,
    status TEXT NOT NULL,
    referenceId INTEGER,
    referenceType TEXT,
    resultingStock INTEGER,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (productId) REFERENCES products(id)
  );

  CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(productId);
  CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(type);
  CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements(createdAt);
  CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
  CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
  CREATE INDEX IF NOT EXISTS idx_product_locations_product ON product_locations(productId);
`);

// ==========================================
// SEED DATA
// ==========================================

const seedIfEmpty = () => {
  const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get();
  if (productCount.count > 0) return;

  const insertProduct = db.prepare(`
    INSERT INTO products (name, sku, category, unit, currentStock, lowStockThreshold, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);

  const insertLocation = db.prepare(`
    INSERT OR IGNORE INTO locations (name, code, address, status)
    VALUES (?, ?, ?, 'Active')
  `);

  const insertProductLocation = db.prepare(`
    INSERT OR IGNORE INTO product_locations (productId, locationName, quantity)
    VALUES (?, ?, ?)
  `);

  const seedTransaction = db.transaction(() => {
    // Seed locations
    insertLocation.run('Main Store', 'WH-MAIN', 'Downtown Facility');
    insertLocation.run('Production Rack', 'WH-PROD', 'Factory Floor');
    insertLocation.run('Warehouse A', 'WH-A', 'Storage Complex');

    // Seed products
    const products = [
      ['Wireless Mouse', 'ELEC-001', 'Electronics', 'Pcs', 45, 10],
      ['Mechanical Keyboard', 'ELEC-002', 'Electronics', 'Pcs', 5, 10],
      ['USB-C Cable (2m)', 'ELEC-003', 'Electronics', 'Pcs', 0, 20],
      ['A4 Printer Paper', 'OFF-001', 'Office Supplies', 'Box', 180, 25],
      ['Blue Gel Pens (Pack of 12)', 'OFF-002', 'Office Supplies', 'Pack', 8, 15],
      ['Stapler', 'OFF-003', 'Office Supplies', 'Pcs', 15, 5],
      ['Ergonomic Office Chair', 'FURN-001', 'Furniture', 'Pcs', 4, 5],
      ['Adjustable Standing Desk', 'FURN-002', 'Furniture', 'Pcs', 0, 2],
      ['Bookshelf (3-Tier)', 'FURN-003', 'Furniture', 'Pcs', 12, 3],
      ['Cardboard Box (Medium)', 'PACK-001', 'Packaging', 'Pcs', 450, 100],
      ['Bubble Wrap (50m roll)', 'PACK-002', 'Packaging', 'Roll', 6, 10],
      ['Packing Tape (Clear)', 'PACK-003', 'Packaging', 'Roll', 85, 20],
    ];

    for (const p of products) {
      const result = insertProduct.run(...p);
      // All stock at Main Store by default
      insertProductLocation.run(result.lastInsertRowid, 'Main Store', p[4]);
    }

    // Seed a supplier
    db.prepare(`INSERT OR IGNORE INTO suppliers (name) VALUES (?)`).run('Default Supplier');
  });

  seedTransaction();
  console.log('Database seeded with initial data.');
};

seedIfEmpty();

export default db;
