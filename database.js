const Database = require('better-sqlite3');
const db = new Database('./confeitaria.db');



db.serialize(() => {
  // ----------------- Usuários -----------------
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE,
    password TEXT,
    plan TEXT DEFAULT 'Free',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // ----------------- Clientes -----------------
  db.run(`CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT,
    email TEXT
  )`);

  // Adiciona coluna "status" em clients se não existir
  db.run(`ALTER TABLE clients ADD COLUMN status TEXT DEFAULT 'A melhorar'`, (err) => {
    if (err && !err.message.includes("duplicate column name")) {
      console.error("Erro ao adicionar coluna status:", err.message);
    }
  });

  // ----------------- Feedbacks -----------------
  db.run(`CREATE TABLE IF NOT EXISTS feedbacks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER,
    rating INTEGER CHECK(rating >= 1 AND rating <= 5),
    comment TEXT,
    photo TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(client_id) REFERENCES clients(id)
  )`);

  // Adiciona coluna "photo" em feedbacks se não existir
  db.run(`ALTER TABLE feedbacks ADD COLUMN photo TEXT`, (err) => {
    if (err && !err.message.includes("duplicate column name")) {
      console.error("Erro ao adicionar coluna photo:", err.message);
    }
  });

  // ----------------- Produtos -----------------
  db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT,
    price REAL,
    stock INTEGER
  )`);

  // ----------------- Pedidos -----------------
  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    client_id INTEGER,
    status TEXT DEFAULT 'Pendente',
    payment_status TEXT DEFAULT 'Pendente',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // ----------------- Itens dos Pedidos -----------------
  db.run(`CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    product_id INTEGER,
    quantity INTEGER,
    FOREIGN KEY(order_id) REFERENCES orders(id),
    FOREIGN KEY(product_id) REFERENCES products(id)
  )`);
});

module.exports = db;
