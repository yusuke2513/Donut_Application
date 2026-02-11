/*
import pkg from "pg";
const { Pool } = pkg;

export const pool = new Pool({
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "Heart_k556",
  database: "donut",
});
*/

import pkg from "pg";
import dotenv from "dotenv"; // 🌟 .envを読み込むためのインポート
import path from "path"; // 🌟 追加
import { fileURLToPath } from "url"; // 🌟 追加
const { Pool } = pkg;

// .env ファイルに書かれた内容を process.env に読み込ませる
dotenv.config(); 

/*
// 🌟 現在のファイルの場所から .env の絶対パスを計算する
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });
// 🌟 デバッグ用：パスワードが読み込めているかターミナルに表示（後で消してください）
console.log("接続先DB:", process.env.DB_NAME);
console.log("パスワード読み込み確認:", process.env.DB_PASSWORD ? "OK" : "❌ 未設定");

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});
*/

export const pool = new Pool({
  // 🌟 ポイント1: 個別の host や port ではなく、URLを丸ごと使う
  connectionString: process.env.DATABASE_URL,
  
  // 🌟 ポイント2: NeonなどのクラウドDB接続には SSL 設定が必須
  ssl: {
    rejectUnauthorized: false,
  },
});
