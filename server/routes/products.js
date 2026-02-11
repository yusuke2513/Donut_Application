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

// products.js の例
router.get("/", async (req, res) => {
  try {
    console.log("API: 商品データを取得開始します..."); // 🌟 これを追加
    const result = await pool.query("SELECT * FROM products");
    console.log("取得したデータ数:", result.rows.length); // 🌟 実際に何件取れたか表示
    res.json(result.rows);
  } catch (err) {
    console.error("SQLエラー詳細:", err); // 🌟 エラー内容を詳しく出す
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
