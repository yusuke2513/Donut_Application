// toppings.js として作成
import express from "express";
import { pool } from "../db.js";

const router = express.Router();

// GET /api/toppings で呼ばれる処理
router.get("/", async (req, res) => {
  try {
    // 🌟 シンプルに toppings テーブルから全データを取得
    const result = await pool.query(`
      SELECT id, name, price FROM toppings
      ORDER BY id ASC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB error" });
  }
});

export default router;