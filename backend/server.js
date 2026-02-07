import express from 'express';
import { pool } from './db.js';

const app = express();
app.use(express.json());

app.get('/api/products', async (req, res) => {
  try {
    const donuts = await pool.query(
      "SELECT id, name, price, 'donut' AS type FROM donuts"
    );
    const soft = await pool.query(
      "SELECT id, name, price, 'soft_cream' AS type FROM soft_creams"
    );
    const drinks = await pool.query(
      "SELECT id, name, price, 'drink' AS type FROM drinks"
    );

    res.json([
      ...donuts.rows,
      ...soft.rows,
      ...drinks.rows,
    ]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3001, () => {
  console.log('API server running on http://localhost:3001');
});
