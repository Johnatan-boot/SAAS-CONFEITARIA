require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // obrigatório para Render
});

async function initDB() {
  try {
    // Usuários
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        plan VARCHAR(50)
      );
    `);

    // Clientes
    await pool.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255),
        email VARCHAR(255),
        status VARCHAR(50)
      );
    `);

    // Produtos
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255),
        price NUMERIC(10,2),
        stock INT
      );
    `);

    // Pedidos
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        client_id INT REFERENCES clients(id) ON DELETE CASCADE,
        status VARCHAR(50),
        payment_status VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Itens de pedidos
    await pool.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        order_id INT REFERENCES orders(id) ON DELETE CASCADE,
        product_id INT REFERENCES products(id) ON DELETE CASCADE,
        quantity INT
      );
    `);

    // Feedbacks
    await pool.query(`
      CREATE TABLE IF NOT EXISTS feedbacks (
        id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        client_id INT REFERENCES clients(id) ON DELETE CASCADE,
        rating INT,
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
