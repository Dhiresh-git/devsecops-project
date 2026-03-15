const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { Pool } = require('pg');
const { body, validationResult } = require('express-validator');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3003;

// Service URLs - Environment Variables se lenge
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:3001';
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002';

// Security Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Database Connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: 'orderdb',
  password: process.env.DB_PASSWORD,
  port: 5432,
  ssl: { rejectUnauthorized: false }
});

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'order-service',
    timestamp: new Date().toISOString()
  });
});

// Get All Orders
app.get('/orders', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM orders ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching orders:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Order By ID
app.get('/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM orders WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching order:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create Order
app.post('/orders', [
  body('user_id')
    .notEmpty().withMessage('User ID is required')
    .isInt({ min: 1 }).withMessage('Invalid User ID'),
  body('product_id')
    .notEmpty().withMessage('Product ID is required')
    .isInt({ min: 1 }).withMessage('Invalid Product ID'),
  body('quantity')
    .notEmpty().withMessage('Quantity is required')
    .isInt({ min: 1 }).withMessage('Quantity must be at least 1')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { user_id, product_id, quantity } = req.body;

    // Step 1: User verify karo
    const userResponse = await axios.get(
      `${USER_SERVICE_URL}/users/${user_id}`
    );
    if (!userResponse.data) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Step 2: Product aur Stock check karo
    const productResponse = await axios.get(
      `${PRODUCT_SERVICE_URL}/products/${product_id}`
    );
    const product = productResponse.data;

    if (product.stock < quantity) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    // Step 3: Total calculate karo
    const total_price = product.price * quantity;

    // Step 4: Order create karo
    const result = await pool.query(
      `INSERT INTO orders (user_id, product_id, quantity, total_price, status)
       VALUES ($1, $2, $3, $4, 'pending') RETURNING *`,
      [user_id, product_id, quantity, total_price]
    );

    // Step 5: Product stock update karo
    await axios.patch(
      `${PRODUCT_SERVICE_URL}/products/${product_id}/stock`,
      { stock: product.stock - quantity }
    );

    res.status(201).json(result.rows[0]);

  } catch (err) {
    if (err.response?.status === 404) {
      return res.status(404).json({ error: 'User or Product not found' });
    }
    console.error('Error creating order:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update Order Status
app.patch('/orders/:id/status', [
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Invalid status')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { id } = req.params;
    const { status } = req.body;
    const result = await pool.query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating order:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Initialize Database Table
const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Orders table initialized!');
  } catch (err) {
    console.error('DB Init Error:', err.message);
  }
};

// Start Server
app.listen(PORT, async () => {
  await initDB();
  console.log(`Order Service running on port ${PORT}`);
});

module.exports = app;