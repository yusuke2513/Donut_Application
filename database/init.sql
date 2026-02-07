

CREATE TABLE donuts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  price INT NOT NULL
);

CREATE TABLE soft_creams (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  price INT NOT NULL
);

CREATE TABLE drinks (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  price INT NOT NULL
);

CREATE TABLE orders (
  order_id SERIAL PRIMARY KEY,
  product_type VARCHAR(20) NOT NULL, -- donut / soft_cream / drink
  product_id INT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT '未提供',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO donuts (name, price)
VALUES ('プレーンドーナツ', 150);
INSERT INTO donuts (name, price)
VALUES ('チョコドーナツ', 150);

INSERT INTO soft_creams (name, price)
VALUES ('milkyソフト', 300);
INSERT INTO soft_creams (name, price)
VALUES ('チョコソフト', 300);

INSERT INTO drinks (name, price)
VALUES ('のむmilky', 250);
INSERT INTO drinks (name, price)
VALUES ('アイスコーヒー', 250);

SELECT current_database();

SELECT * FROM donuts;
