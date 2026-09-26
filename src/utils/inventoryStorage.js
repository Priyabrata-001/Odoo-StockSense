const PRODUCTS_KEY = 'stocksense_products';
const ACTIVITY_KEY = 'stocksense_activity_log';

// Helper to get from local storage
const getFromStorage = (key, defaultValue = []) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return defaultValue;
  }
};

// Helper to save to local storage
const saveToStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
};

// Activity Log Functions
export const getActivityLog = (limit = null) => {
  const activities = getFromStorage(ACTIVITY_KEY);
  // Sort newest first
  const sorted = activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return limit ? sorted.slice(0, limit) : sorted;
};

export const addActivity = (type, description, productId = null, productName = null) => {
  const activities = getFromStorage(ACTIVITY_KEY);
  const newActivity = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
    type,
    description,
    productId,
    productName,
    timestamp: new Date().toISOString()
  };
  
  activities.push(newActivity);
  saveToStorage(ACTIVITY_KEY, activities);
  return newActivity;
};

export const clearActivityLog = () => {
  saveToStorage(ACTIVITY_KEY, []);
  return true;
};

// Product Functions
export const getProducts = () => {
  return getFromStorage(PRODUCTS_KEY);
};

export const getProductById = (id) => {
  const products = getProducts();
  return products.find(p => p.id === id) || null;
};

export const getProductBySku = (sku) => {
  const products = getProducts();
  const lowerSku = sku.toLowerCase();
  return products.find(p => p.sku.toLowerCase() === lowerSku) || null;
};

export const saveProduct = (productData) => {
  const products = getProducts();
  
  const newProduct = {
    ...productData,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    currentStock: productData.initialStock !== undefined ? productData.initialStock : 0
  };
  
  products.push(newProduct);
  saveToStorage(PRODUCTS_KEY, products);
  
  addActivity(
    'product_added',
    `Added new product: ${newProduct.name} (${newProduct.sku})`,
    newProduct.id,
    newProduct.name
  );
  
  return newProduct;
};

export const updateProduct = (id, updates) => {
  const products = getProducts();
  const index = products.findIndex(p => p.id === id);
  
  if (index === -1) return null;
  
  const existingProduct = products[index];
  const updatedProduct = {
    ...existingProduct,
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  products[index] = updatedProduct;
  saveToStorage(PRODUCTS_KEY, products);
  
  addActivity(
    'product_updated',
    `Updated product: ${updatedProduct.name}`,
    updatedProduct.id,
    updatedProduct.name
  );
  
  return updatedProduct;
};

export const deleteProduct = (id) => {
  const products = getProducts();
  const productToDelete = products.find(p => p.id === id);
  
  if (!productToDelete) return false;
  
  const filteredProducts = products.filter(p => p.id !== id);
  saveToStorage(PRODUCTS_KEY, filteredProducts);
  
  addActivity(
    'product_deleted',
    `Deleted product: ${productToDelete.name} (${productToDelete.sku})`,
    id,
    productToDelete.name
  );
  
  return true;
};

export const getProductsByCategory = (category) => {
  const products = getProducts();
  return products.filter(p => p.category === category);
};

export const searchProducts = (query) => {
  if (!query) return getProducts();
  
  const products = getProducts();
  const lowerQuery = query.toLowerCase();
  
  return products.filter(p => 
    p.name.toLowerCase().includes(lowerQuery) || 
    p.sku.toLowerCase().includes(lowerQuery)
  );
};

export const getLowStockProducts = () => {
  const products = getProducts();
  return products.filter(p => p.currentStock <= p.lowStockThreshold && p.currentStock > 0);
};

export const getOutOfStockProducts = () => {
  const products = getProducts();
  return products.filter(p => p.currentStock === 0);
};

export const getCategories = () => {
  const products = getProducts();
  const categories = new Set(products.map(p => p.category));
  return Array.from(categories);
};

export const getProductStats = () => {
  const products = getProducts();
  
  const stats = {
    totalProducts: products.length,
    lowStockCount: 0,
    outOfStockCount: 0,
    totalValue: 0, // Placeholder if value/price is added later
    categoryCounts: {}
  };
  
  products.forEach(p => {
    // Counts
    if (p.currentStock === 0) {
      stats.outOfStockCount++;
    } else if (p.currentStock <= p.lowStockThreshold) {
      stats.lowStockCount++;
    }
    
    // Category Distribution
    if (!stats.categoryCounts[p.category]) {
      stats.categoryCounts[p.category] = 0;
    }
    stats.categoryCounts[p.category]++;
  });
  
  return stats;
};

// Seed Data Function
export const seedProducts = () => {
  const existingProducts = getProducts();
  
  if (existingProducts.length === 0) {
    const seedData = [
      {
        id: 'seed-1',
        name: 'Wireless Mouse',
        sku: 'ELEC-001',
        category: 'Electronics',
        unit: 'Pcs',
        initialStock: 50,
        currentStock: 45,
        lowStockThreshold: 10,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'seed-2',
        name: 'Mechanical Keyboard',
        sku: 'ELEC-002',
        category: 'Electronics',
        unit: 'Pcs',
        initialStock: 30,
        currentStock: 5,
        lowStockThreshold: 10,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'seed-3',
        name: 'USB-C Cable (2m)',
        sku: 'ELEC-003',
        category: 'Electronics',
        unit: 'Pcs',
        initialStock: 100,
        currentStock: 0,
        lowStockThreshold: 20,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'seed-4',
        name: 'A4 Printer Paper',
        sku: 'OFF-001',
        category: 'Office Supplies',
        unit: 'Box',
        initialStock: 200,
        currentStock: 180,
        lowStockThreshold: 25,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'seed-5',
        name: 'Blue Gel Pens (Pack of 12)',
        sku: 'OFF-002',
        category: 'Office Supplies',
        unit: 'Pack',
        initialStock: 50,
        currentStock: 8,
        lowStockThreshold: 15,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'seed-6',
        name: 'Stapler',
        sku: 'OFF-003',
        category: 'Office Supplies',
        unit: 'Pcs',
        initialStock: 20,
        currentStock: 15,
        lowStockThreshold: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'seed-7',
        name: 'Ergonomic Office Chair',
        sku: 'FURN-001',
        category: 'Furniture',
        unit: 'Pcs',
        initialStock: 10,
        currentStock: 4,
        lowStockThreshold: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'seed-8',
        name: 'Adjustable Standing Desk',
        sku: 'FURN-002',
        category: 'Furniture',
        unit: 'Pcs',
        initialStock: 5,
        currentStock: 0,
        lowStockThreshold: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'seed-9',
        name: 'Bookshelf (3-Tier)',
        sku: 'FURN-003',
        category: 'Furniture',
        unit: 'Pcs',
        initialStock: 15,
        currentStock: 12,
        lowStockThreshold: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'seed-10',
        name: 'Cardboard Box (Medium)',
        sku: 'PACK-001',
        category: 'Packaging',
        unit: 'Pcs',
        initialStock: 500,
        currentStock: 450,
        lowStockThreshold: 100,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'seed-11',
        name: 'Bubble Wrap (50m roll)',
        sku: 'PACK-002',
        category: 'Packaging',
        unit: 'Roll',
        initialStock: 20,
        currentStock: 6,
        lowStockThreshold: 10,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'seed-12',
        name: 'Packing Tape (Clear)',
        sku: 'PACK-003',
        category: 'Packaging',
        unit: 'Roll',
        initialStock: 100,
        currentStock: 85,
        lowStockThreshold: 20,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    
    saveToStorage(PRODUCTS_KEY, seedData);
    
    const existingActivity = getFromStorage(ACTIVITY_KEY);
    if (existingActivity.length === 0) {
      const now = new Date();
      const seedActivities = [
        {
          id: 'act-1',
          type: 'stock_adjusted',
          description: 'Initial inventory seeded into the system',
          productId: null,
          productName: 'Multiple Products',
          timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 48).toISOString() // 48 hours ago
        },
        {
          id: 'act-2',
          type: 'product_added',
          description: 'Added new product: Wireless Mouse (ELEC-001)',
          productId: 'seed-1',
          productName: 'Wireless Mouse',
          timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 24).toISOString() // 24 hours ago
        },
        {
          id: 'act-3',
          type: 'product_updated',
          description: 'Updated product: Blue Gel Pens (Pack of 12)',
          productId: 'seed-5',
          productName: 'Blue Gel Pens (Pack of 12)',
          timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 12).toISOString() // 12 hours ago
        },
        {
          id: 'act-4',
          type: 'stock_adjusted',
          description: 'Stock decreased for Mechanical Keyboard (Sold)',
          productId: 'seed-2',
          productName: 'Mechanical Keyboard',
          timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
        },
        {
          id: 'act-5',
          type: 'product_added',
          description: 'Added new product: Adjustable Standing Desk (FURN-002)',
          productId: 'seed-8',
          productName: 'Adjustable Standing Desk',
          timestamp: new Date(now.getTime() - 1000 * 60 * 30).toISOString() // 30 minutes ago
        }
      ];
      saveToStorage(ACTIVITY_KEY, seedActivities);
    }
  }
};

// ==========================================
// RECEIPTS & DELIVERIES
// ==========================================

const RECEIPTS_KEY = 'stocksense_receipts';
const DELIVERIES_KEY = 'stocksense_deliveries';

// Receipts
export const getReceipts = () => {
  return getFromStorage(RECEIPTS_KEY);
};

export const saveReceipt = (receiptData) => {
  const receipts = getReceipts();
  const newReceipt = {
    ...receiptData,
    id: Date.now().toString(),
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  receipts.push(newReceipt);
  saveToStorage(RECEIPTS_KEY, receipts);
  
  addActivity(
    'receipt_created',
    `Created receipt for ${newReceipt.quantity} units from ${newReceipt.supplierName}`,
    newReceipt.productId
  );
  
  return newReceipt;
};

export const validateReceipt = (id) => {
  const receipts = getReceipts();
  const index = receipts.findIndex(r => r.id === id);
  if (index === -1) return false;
  
  const receipt = receipts[index];
  if (receipt.status === 'VALIDATED') return false;
  
  // Update stock
  const products = getProducts();
  const productIndex = products.findIndex(p => p.id === receipt.productId);
  if (productIndex === -1) return false;
  
  const product = products[productIndex];
  product.currentStock += Number(receipt.quantity);
  product.updatedAt = new Date().toISOString();
  saveToStorage(PRODUCTS_KEY, products);
  
  // Update receipt
  receipt.status = 'VALIDATED';
  receipt.updatedAt = new Date().toISOString();
  saveToStorage(RECEIPTS_KEY, receipts);
  
  addActivity(
    'receipt_validated',
    `Validated receipt: +${receipt.quantity} ${product.unit} of ${product.name}`,
    product.id,
    product.name
  );
  
  return true;
};

// Deliveries
export const getDeliveries = () => {
  return getFromStorage(DELIVERIES_KEY);
};

export const saveDelivery = (deliveryData) => {
  const deliveries = getDeliveries();
  const newDelivery = {
    ...deliveryData,
    id: Date.now().toString(),
    status: 'CREATED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  deliveries.push(newDelivery);
  saveToStorage(DELIVERIES_KEY, deliveries);
  
  addActivity(
    'delivery_created',
    `Created delivery order for ${newDelivery.quantity} units`,
    newDelivery.productId
  );
  
  return newDelivery;
};

export const updateDeliveryStatus = (id, status) => {
  const deliveries = getDeliveries();
  const index = deliveries.findIndex(d => d.id === id);
  if (index === -1) return { success: false, message: 'Delivery not found' };
  
  const delivery = deliveries[index];
  if (delivery.status === 'VALIDATED') return { success: false, message: 'Already validated' };
  
  if (status === 'VALIDATED') {
    // Check stock and update
    const products = getProducts();
    const productIndex = products.findIndex(p => p.id === delivery.productId);
    if (productIndex === -1) return { success: false, message: 'Product not found' };
    
    const product = products[productIndex];
    if (product.currentStock < Number(delivery.quantity)) {
      return { success: false, message: `Insufficient stock. Available: ${product.currentStock}` };
    }
    
    product.currentStock -= Number(delivery.quantity);
    product.updatedAt = new Date().toISOString();
    saveToStorage(PRODUCTS_KEY, products);
    
    addActivity(
      'delivery_validated',
      `Validated delivery: -${delivery.quantity} ${product.unit} of ${product.name}`,
      product.id,
      product.name
    );
  } else {
     addActivity(
      'delivery_updated',
      `Delivery status updated to ${status}`,
      delivery.productId
    );
  }
  
  delivery.status = status;
  delivery.updatedAt = new Date().toISOString();
  saveToStorage(DELIVERIES_KEY, deliveries);
  
  return { success: true };
};
