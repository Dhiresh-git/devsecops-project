const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { Pool } = require('pg');
const { body, validationResult } = require('express-validator');

const app = express();
const PORT = process.env.PORT || 3002;

// Security Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Database Connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: 'productdb',
  password: process.env.DB_PASSWORD,
  port: 5432,
  ssl: { rejectUnauthorized: false }
});

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'product-service',
    timestamp: new Date().toISOString()
  });
});

// Get All Products
app.get('/products', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM products ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching products:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Product By ID
app.get('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM products WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching product:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create Product - With Validation!
app.post('/products', [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('price')
    .notEmpty().withMessage('Price is required')
    .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('stock')
    .notEmpty().withMessage('Stock is required')
    .isInt({ min: 0 }).withMessage('Stock must be a positive integer')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, price, stock } = req.body;
    const result = await pool.query(
      'INSERT INTO products (name, price, stock) VALUES ($1, $2, $3) RETURNING *',
      [name, price, stock]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating product:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update Product Stock
app.patch('/products/:id/stock', [
  body('stock')
    .notEmpty().withMessage('Stock is required')
    .isInt({ min: 0 }).withMessage('Stock must be a positive integer')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { id } = req.params;
    const { stock } = req.body;
    const result = await pool.query(
      'UPDATE products SET stock = $1 WHERE id = $2 RETURNING *',
      [stock, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating stock:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete Product
app.delete('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM products WHERE id = $1', [id]);
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Error deleting product:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Initialize Database Table
const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        stock INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Products table initialized!');
  } catch (err) {
    console.error('DB Init Error:', err.message);
  }
};

// Start Server
app.listen(PORT, async () => {
  await initDB();
  console.log(`Product Service running on port ${PORT}`);
});

module.exports = app;
