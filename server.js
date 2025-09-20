require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const session = require('express-session');
const db = require('./database'); // Pool do pg

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Sessão
app.use(session({
  secret: 'segredo-super-seguro',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// ----------------- Middleware -----------------
function authMiddleware(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: 'Não autorizado' });
  next();
}

// ----------------- Autenticação -----------------
app.post('/api/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);

    const result = await db.query(
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id",
      [name, email, hashedPassword]
    );

    const userId = result.rows[0].id;
    req.session.userId = userId;
    res.json({ success: true, userId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = result.rows[0];

    if (!user) return res.status(400).json({ error: 'Usuário não encontrado' });
    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(400).json({ error: 'Senha inválida' });
    }

    req.session.userId = user.id;
    res.json({ success: true, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/me', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      "SELECT id, name, email, plan FROM users WHERE id = $1",
      [req.session.userId]
    );
    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------- CLIENTES -----------------
app.get('/api/clients', authMiddleware, async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM clients WHERE user_id = $1", [req.session.userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/clients', authMiddleware, async (req, res) => {
  try {
    const { name, email, status } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'Preencha todos os campos!' });

    const result = await db.query(
      "INSERT INTO clients (user_id, name, email, status) VALUES ($1, $2, $3, $4) RETURNING id",
      [req.session.userId, name, email, status || 'A melhorar']
    );

    res.json({ success: true, id: result.rows[0].id, name, email, status: status || 'A melhorar' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/clients/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, status } = req.body;

    await db.query(
      "UPDATE clients SET name = $1, email = $2, status = $3 WHERE id = $4 AND user_id = $5",
      [name, email, status || 'A melhorar', id, req.session.userId]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/clients/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM clients WHERE id = $1 AND user_id = $2", [id, req.session.userId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/clients/status-summary', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      "SELECT status, COUNT(*) as count FROM clients WHERE user_id = $1 GROUP BY status",
      [req.session.userId]
    );
    const summary = { Satisfeito: 0, Insatisfeito: 0, 'A melhorar': 0 };
    result.rows.forEach(r => summary[r.status] = parseInt(r.count));
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------- FEEDBACKS -----------------
app.post('/api/feedbacks', authMiddleware, async (req, res) => {
  try {
    const { client_id, rating, comment, photo } = req.body;
    if (!client_id || !rating) return res.status(400).json({ error: 'Campos obrigatórios faltando' });

    const result = await db.query(
      "INSERT INTO feedbacks (client_id, rating, comment, photo) VALUES ($1, $2, $3, $4) RETURNING id",
      [client_id, rating, comment || '', photo || null]
    );
    res.json({ id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/feedbacks', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT f.id, f.client_id, f.rating, f.comment, f.photo, c.name AS client_name
      FROM feedbacks f
      JOIN clients c ON f.client_id = c.id
      WHERE c.user_id = $1
    `, [req.session.userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/feedbacks/:client_id', authMiddleware, async (req, res) => {
  try {
    const { client_id } = req.params;
    const result = await db.query("SELECT * FROM feedbacks WHERE client_id = $1", [client_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------- PRODUTOS -----------------
app.get('/api/products', authMiddleware, async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM products WHERE user_id = $1", [req.session.userId]);
    
    // Corrigir price para Number
    const products = result.rows.map(p => ({
      ...p,
      price: parseFloat(p.price) // converte string para número
    }));

    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.post('/api/products', authMiddleware, async (req, res) => {
  try {
    const { name, price, stock } = req.body;
    if (!name || price == null || stock == null)
      return res.status(400).json({ error: 'Preencha todos os campos!' });

    const result = await db.query(
      "INSERT INTO products (user_id, name, price, stock) VALUES ($1, $2, $3, $4) RETURNING id",
      [req.session.userId, name, price, stock]
    );
    res.json({ success: true, id: result.rows[0].id, name, price, stock });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/products/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, stock } = req.body;
    await db.query(
      "UPDATE products SET name=$1, price=$2, stock=$3 WHERE id=$4 AND user_id=$5",
      [name, price, stock, id, req.session.userId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/products/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM products WHERE id=$1 AND user_id=$2", [id, req.session.userId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------- ORDERS -----------------
// Criar pedido de um único produto
app.post('/api/orders/single', authMiddleware, async (req, res) => {
  try {
    const { client_id, product_id, quantity, status } = req.body;
    if (!client_id || !product_id || !quantity)
      return res.status(400).json({ error: 'Preencha todos os campos!' });

    const productResult = await db.query(
      "SELECT stock FROM products WHERE id=$1 AND user_id=$2",
      [product_id, req.session.userId]
    );

    const product = productResult.rows[0];
    if (!product) return res.status(404).json({ error: 'Produto não encontrado' });
    if (product.stock < quantity) return res.status(400).json({ error: 'Estoque insuficiente!' });

    const orderResult = await db.query(
      "INSERT INTO orders (user_id, client_id, status, payment_status) VALUES ($1, $2, $3, $4) RETURNING id",
      [req.session.userId, client_id, status || 'Pendente', 'Pendente']
    );

    const orderId = orderResult.rows[0].id;

    await db.query(
      "INSERT INTO order_items (order_id, product_id, quantity) VALUES ($1, $2, $3)",
      [orderId, product_id, quantity]
    );

    await db.query(
      "UPDATE products SET stock = stock - $1 WHERE id = $2 AND user_id = $3",
      [quantity, product_id, req.session.userId]
    );

    res.json({ success: true, orderId, estoque_restante: product.stock - quantity });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Criar pedido múltiplo
app.post('/api/orders/multi', authMiddleware, async (req, res) => {
  try {
    const { client_id, items, status } = req.body;
    if (!client_id || !items || items.length === 0)
      return res.status(400).json({ error: 'Informe cliente e itens.' });

    const orderResult = await db.query(
      "INSERT INTO orders (user_id, client_id, status, payment_status) VALUES ($1, $2, $3, $4) RETURNING id",
      [req.session.userId, client_id, status || 'Pendente', 'Pendente']
    );

    const orderId = orderResult.rows[0].id;

    for (const item of items) {
      await db.query(
        "INSERT INTO order_items (order_id, product_id, quantity) VALUES ($1, $2, $3)",
        [orderId, item.product_id, item.quantity]
      );
      await db.query(
        "UPDATE products SET stock = stock - $1 WHERE id = $2 AND user_id = $3",
        [item.quantity, item.product_id, req.session.userId]
      );
    }

    res.json({ success: true, orderId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET orders
app.get('/api/orders', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT o.id AS order_id, o.status, o.payment_status, o.created_at,
             c.id AS client_id, c.name AS client_name,
             p.id AS product_id, p.name AS product_name, p.price,
             oi.quantity, (oi.quantity * p.price) AS total
      FROM orders o
      JOIN clients c ON o.client_id = c.id
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      WHERE o.user_id = $1
      ORDER BY o.id DESC
    `, [req.session.userId]);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/orders/client/:client_id', authMiddleware, async (req, res) => {
  try {
    const { client_id } = req.params;
    const result = await db.query(`
      SELECT o.id AS order_id, o.status, o.payment_status, o.created_at,
             c.name AS client_name,
             p.id AS product_id, p.name AS product_name, p.price,
             oi.quantity, (oi.quantity * p.price) AS total
      FROM orders o
      JOIN clients c ON o.client_id = c.id
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      WHERE o.user_id=$1 AND o.client_id=$2
      ORDER BY o.id DESC
    `, [req.session.userId, client_id]);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------- Servidor -----------------
app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));
