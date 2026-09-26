import express from 'express';
import cors from 'cors';
import db from './db.js';
import productsRouter from './routes/products.js';
import receiptsRouter from './routes/receipts.js';
import deliveriesRouter from './routes/deliveries.js';
import transfersRouter from './routes/transfers.js';
import adjustmentsRouter from './routes/adjustments.js';
import movementsRouter from './routes/movements.js';
import locationsRouter from './routes/locations.js';
import authRouter from './routes/auth.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/receipts', receiptsRouter);
app.use('/api/deliveries', deliveriesRouter);
app.use('/api/transfers', transfersRouter);
app.use('/api/adjustments', adjustmentsRouter);
app.use('/api/movements', movementsRouter);
app.use('/api/locations', locationsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`StockSense API server running on http://localhost:${PORT}`);
});
