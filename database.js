require('dotenv').config();
const { Pool } = require('pg');

const isRender = !!process.env.RENDER_INTERNAL_HOSTNAME;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // necessário para Render
});


async function initDB() {
  try {
    // Aqui você pode criar as tabelas se ainda não existirem
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        plan VARCHAR(50)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        name VARCHAR(255),
        email VARCHAR(255),
        status VARCHAR(50)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        name VARCHAR(255),
        price NUMERIC(10,2),
        stock INTEGER
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        client_id INTEGER REFERENCES clients(id),
        status VARCHAR(50),
        payment_status VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id),
        product_id INTEGER REFERENCES products(id),
        quantity INTEGER
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS feedbacks (
        id SERIAL PRIMARY KEY,
        client_id INTEGER REFERENCES clients(id),
        rating INTEGER,
        comment TEXT,
        photo TEXT
      );
    `);

    console.log("✅ Banco inicializado com sucesso!");
  } catch (err) {
    console.error("❌ Erro ao inicializar o banco:", err);
  }
}

initDB();

module.exports = pool;
