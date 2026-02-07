import express from "express";
import { pool } from "../db.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, price, 'donut' AS type FROM donuts
      UNION ALL
      SELECT id, name, price, 'drink' AS type FROM drinks
      UNION ALL
      SELECT id, name, price, 'soft_cream' AS type FROM soft_creams
      ORDER BY type, id
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB error" });
  }
});

export default router;
