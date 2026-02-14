-- 1. テーブル作成
CREATE TABLE IF NOT EXISTS donuts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  price INT NOT NULL
);

CREATE TABLE IF NOT EXISTS soft_creams (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  price INT NOT NULL
);

CREATE TABLE IF NOT EXISTS drinks (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  price INT NOT NULL
);

CREATE TABLE IF NOT EXISTS toppings (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  price INTEGER NOT NULL
);

-- 注文管理テーブル（将来の保存用）
CREATE TABLE IF NOT EXISTS orders (
  order_id SERIAL PRIMARY KEY,
  product_type VARCHAR(20) NOT NULL,
  product_id INT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT '未提供',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. データの「二重登録」を防ぐため、一度中身をリセット
TRUNCATE TABLE donuts, soft_creams, drinks, toppings RESTART IDENTITY;

-- 3. 最新メニューの投入

-- ドーナツ（ポップアップで味を選ぶ「親メニュー」のみ登録）
INSERT INTO donuts (name, price) VALUES 
('milkyドーナツ', 209),
('milkyクリームドーナツ', 231),
('milkyボールドーナツ', 260);

-- ドリンク（ポップアップで Ice/Hot を選ぶため、商品名のみ登録）
INSERT INTO drinks (name, price) VALUES 
('のむmilky', 400),
('のむmilkyコーヒー', 430),
('のむmilkyティー', 430);

-- ソフトクリーム（器によって値段が変わるため、器を商品として登録）
INSERT INTO soft_creams (name, price) VALUES 
('ソフトクリーム(カップ)', 430),
('ソフトクリーム(キッズサイズカップ)', 350),
('ソフトクリーム(コーン)', 480);

-- トッピング
INSERT INTO toppings (name, price) VALUES 
('カラースプレー', 30),
('チョコチップ', 30);

-- 4. 確認用
SELECT * FROM donuts;
SELECT * FROM soft_creams;
SELECT * FROM drinks;
SELECT * FROM toppings;