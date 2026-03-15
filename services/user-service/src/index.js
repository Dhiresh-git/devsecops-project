const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { Pool } = require('pg');
const { body, validationResult } = require('express-validator');

const app = express();
const PORT = process.env.PORT || 3001;

// Security Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Database Connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: 'userdb',
  password: process.env.DB_PASSWORD,
  port: 5432,
  ssl: { rejectUnauthorized: false }
});

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'user-service',
    timestamp: new Date().toISOString()
  });
});

// Get All Users
app.get('/users', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching users:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get User By ID
app.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT id, name, email, created_at FROM users WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching user:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create User - With Validation!
app.post('/users', [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
], async (req, res) => {
  // Validation Check
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, email } = req.body;
    const result = await pool.query(
      'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id, name, email, created_at',
      [name, email]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating user:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete User
app.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Initialize Database Table
const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Users table initialized!');
  } catch (err) {
    console.error('DB Init Error:', err.message);
  }
};

// Start Server
app.listen(PORT, async () => {
  await initDB();
  console.log(`User Service running on port ${PORT}`);
});

module.exports = app;
