import pkg from 'pg';
const { Pool } = pkg;

export const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'donut',
  password: 'Heart_k556',
  port: 5432,
});
