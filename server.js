const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const session = require('express-session');
const db = require('./database'); // seu arquivo db.js

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

// ----------------- Autenticação -----------------
app.post('/api/signup', (req, res) => {
  const { name, email, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);

  const stmt = db.prepare(`INSERT INTO users (name, email, password) VALUES (?, ?, ?)`);
  stmt.run([name, email, hashedPassword], function(err) {
    if (err) return res.status(500).json({ error: err.message });

    req.session.userId = this.lastID;
    res.json({ success: true, userId: this.lastID });
  });
  stmt.finalize();
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(400).json({ error: 'Usuário não encontrado' });

    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(400).json({ error: 'Senha inválida' });
    }

    req.session.userId = user.id;
    res.json({ success: true, user });
  });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// Middleware proteção
function authMiddleware(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: 'Não autorizado' });
  next();
}

// ----------------- Usuário logado -----------------
app.get('/api/me', authMiddleware, (req, res) => {
  db.get(`SELECT id, name, email, plan FROM users WHERE id = ?`, [req.session.userId], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ user });
  });
});

// ----------------- CLIENTES -----------------

// Histórico individual do cliente
app.get('/api/orders/client/:client_id', authMiddleware, (req, res) => {
  const { client_id } = req.params;
  db.all(`
    SELECT o.id, o.quantity, o.status, o.payment_status,
           c.name AS client_name, p.name AS product_name, p.price,
           (o.quantity * p.price) AS total
    FROM orders o
    JOIN clients c ON o.client_id = c.id
    JOIN products p ON o.product_id = p.id
    WHERE o.user_id = ? AND o.client_id = ?
    ORDER BY o.id DESC
  `, [req.session.userId, client_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/clients', authMiddleware, (req, res) => {
  db.all("SELECT * FROM clients WHERE user_id = ?", [req.session.userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/clients', authMiddleware, (req, res) => {
  const { name, email, status } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Preencha todos os campos!' });

  const stmt = db.prepare("INSERT INTO clients (user_id, name, email, status) VALUES (?, ?, ?, ?)");
  stmt.run([req.session.userId, name, email, status || 'A melhorar'], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, id: this.lastID, name, email, status: status || 'A melhorar' });
  });
  stmt.finalize();
});

app.put('/api/clients/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { name, email, status } = req.body;
  db.run("UPDATE clients SET name = ?, email = ?, status = ? WHERE id = ? AND user_id = ?",
    [name, email, status || 'A melhorar', id, req.session.userId],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

app.delete('/api/clients/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM clients WHERE id = ? AND user_id = ?", [id, req.session.userId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.get('/api/clients/status-summary', authMiddleware, (req, res) => {
  db.all("SELECT status, COUNT(*) as count FROM clients WHERE user_id = ? GROUP BY status",
    [req.session.userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      const summary = { Satisfeito: 0, Insatisfeito: 0, 'A melhorar': 0 };
      rows.forEach(r => summary[r.status] = r.count);
      res.json(summary);
    }
  );
});

// ----------------- FEEDBACKS -----------------
app.post('/api/feedbacks', authMiddleware, (req, res) => {
  const { client_id, rating, comment, photo } = req.body;
  if (!client_id || !rating) return res.status(400).json({ error: 'Campos obrigatórios faltando' });

  const stmt = db.prepare("INSERT INTO feedbacks (client_id, rating, comment, photo) VALUES (?, ?, ?, ?)");
  stmt.run(client_id, rating, comment || '', photo || null, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID });
  });
  stmt.finalize();
});

// Antes
// app.get('/api/feedbacks', authMiddleware, (req, res) => { ... });

// Depois: trazer também o nome do cliente
app.get('/api/feedbacks', authMiddleware, (req, res) => {
  db.all(`
    SELECT f.id, f.client_id, f.rating, f.comment, f.photo, c.name AS client_name
    FROM feedbacks f
    JOIN clients c ON f.client_id = c.id
    WHERE c.user_id = ?
  `, [req.session.userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});


app.get('/api/feedbacks/:client_id', authMiddleware, (req, res) => {
  const { client_id } = req.params;
  db.all("SELECT * FROM feedbacks WHERE client_id = ?", [client_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ----------------- PRODUTOS -----------------
app.get('/api/products', authMiddleware, (req, res) => {
  db.all("SELECT * FROM products WHERE user_id = ?", [req.session.userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/products', authMiddleware, (req, res) => {
  const { name, price, stock } = req.body;
  if (!name || price == null || stock == null)
    return res.status(400).json({ error: 'Preencha todos os campos!' });

  const stmt = db.prepare("INSERT INTO products (user_id, name, price, stock) VALUES (?, ?, ?, ?)");
  stmt.run([req.session.userId, name, price, stock], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, id: this.lastID, name, price, stock });
  });
  stmt.finalize();
});

app.put('/api/products/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { name, price, stock } = req.body;
  db.run(
    "UPDATE products SET name = ?, price = ?, stock = ? WHERE id = ? AND user_id = ?",
    [name, price, stock, id, req.session.userId],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

app.delete('/api/products/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM products WHERE id = ? AND user_id = ?", [id, req.session.userId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// ----------------- ORDERS -----------------

// Criar pedido de um único produto
app.post('/api/orders/single', authMiddleware, (req, res) => {
  const { client_id, product_id, quantity, status } = req.body;
  if (!client_id || !product_id || !quantity)
    return res.status(400).json({ error: 'Preencha todos os campos!' });

  db.get("SELECT stock FROM products WHERE id = ? AND user_id = ?", 
    [product_id, req.session.userId], 
    (err, product) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!product) return res.status(404).json({ error: 'Produto não encontrado' });

      if (product.stock < quantity) {
        return res.status(400).json({ error: 'Estoque insuficiente!' });
      }

      // Cria pedido base
      db.run(
        "INSERT INTO orders (user_id, client_id, status, payment_status) VALUES (?, ?, ?, ?)",
        [req.session.userId, client_id, status || 'Pendente', 'Pendente'],
        function(err) {
          if (err) return res.status(500).json({ error: err.message });
          const orderId = this.lastID;

          // Insere item no order_items
          db.run(
            "INSERT INTO order_items (order_id, product_id, quantity) VALUES (?, ?, ?)",
            [orderId, product_id, quantity],
            (err2) => {
              if (err2) return res.status(500).json({ error: err2.message });

              // Atualiza estoque
              db.run("UPDATE products SET stock = stock - ? WHERE id = ? AND user_id = ?",
                [quantity, product_id, req.session.userId],
                function(err3) {
                  if (err3) return res.status(500).json({ error: err3.message });

                  res.json({ success: true, orderId, estoque_restante: product.stock - quantity });
                }
              );
            }
          );
        }
      );
    });
});

// Criar pedido com vários itens
app.post('/api/orders/multi', authMiddleware, (req, res) => {
  const { client_id, items, status } = req.body;
  if (!client_id || !items || items.length === 0) {
    return res.status(400).json({ error: 'Informe cliente e itens.' });
  }

  db.run(
    `INSERT INTO orders (user_id, client_id, status, payment_status) VALUES (?, ?, ?, ?)`,
    [req.session.userId, client_id, status || 'Pendente', 'Pendente'],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      const orderId = this.lastID;

      const stmt = db.prepare(`INSERT INTO order_items (order_id, product_id, quantity) VALUES (?, ?, ?)`);

      items.forEach(item => {
        stmt.run(orderId, item.product_id, item.quantity);

        // Atualizar estoque
        db.run(
          `UPDATE products SET stock = stock - ? WHERE id = ? AND user_id = ?`,
          [item.quantity, item.product_id, req.session.userId]
        );
      });

      stmt.finalize();
      res.json({ success: true, orderId });
    }
  );
});

// ----------------- GET ORDERS -----------------

// GET /api/orders - todos os pedidos do usuário logado
app.get('/api/orders', authMiddleware, (req, res) => {
  db.all(`
    SELECT 
      o.id AS order_id,
      o.status,
      o.payment_status,
      o.created_at,
      c.id AS client_id,
      c.name AS client_name,
      p.id AS product_id,
      p.name AS product_name,
      p.price,
      oi.quantity,
      (oi.quantity * p.price) AS total
    FROM orders o
    JOIN clients c ON o.client_id = c.id
    JOIN order_items oi ON o.id = oi.order_id
    JOIN products p ON oi.product_id = p.id
    WHERE o.user_id = ?
    ORDER BY o.id DESC
  `, [req.session.userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});


app.get('/api/orders/client/:client_id', authMiddleware, (req, res) => {
  const { client_id } = req.params;

  db.all(`
    SELECT 
      o.id AS order_id,
      o.status,
      o.payment_status,
      o.created_at,
      c.name AS client_name,
      p.id AS product_id,
      p.name AS product_name,
      p.price,
      oi.quantity,
      (oi.quantity * p.price) AS total
    FROM orders o
    JOIN clients c ON o.client_id = c.id
    JOIN order_items oi ON o.id = oi.order_id
    JOIN products p ON oi.product_id = p.id
    WHERE o.user_id = ? AND o.client_id = ?
    ORDER BY o.id DESC
  `, [req.session.userId, client_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    res.json(rows);
  });
});





// ----------------- Servidor -----------------
app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));
