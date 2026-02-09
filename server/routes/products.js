import express from "express";
import { pool } from "../db.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, price, 'donut' AS product_type FROM donuts
      UNION ALL
      SELECT id, name, price, 'drink' AS product_type FROM drinks
      UNION ALL
      SELECT id, name, price, 'soft_cream' AS product_type FROM soft_creams
      ORDER BY product_type, id
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB error" });
  }
});

export default router;
