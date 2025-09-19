// migrate.js
const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');

const sqliteDB = new sqlite3.Database('./confeitaria.db');
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Função para migrar uma tabela do SQLite para PostgreSQL
async function migrateTable(tableName, columns) {
  return new Promise((resolve, reject) => {
    sqliteDB.all(`SELECT * FROM ${tableName}`, async (err, rows) => {
      if (err) return reject(err);

      for (const row of rows) {
        const keys = columns.join(',');
        const values = columns.map(col => row[col]);
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(',');

        try {
          await pgPool.query(
            `INSERT INTO ${tableName} (${keys}) VALUES (${placeholders})`,
            values
          );
        } catch (err) {
          console.error(`Erro ao migrar tabela ${tableName}:`, err.message);
        }
      }

      console.log(`✅ Migrada tabela ${tableName} com ${rows.length} registros.`);
      resolve();
    });
  });
}

// Migração completa
async function migrate() {
  try {
    await migrateTable('users', ['id', 'name', 'email', 'password', 'plan', 'created_at']);
    await migrateTable('clients', ['id', 'user_id', 'name', 'email', 'status']);
    await migrateTable('feedbacks', ['id', 'client_id', 'rating', 'comment', 'photo', 'created_at']);
    await migrateTable('products', ['id', 'user_id', 'name', 'price', 'stock']);
    await migrateTable('orders', ['id', 'user_id', 'client_id', 'status', 'payment_status', 'created_at']);
    await migrateTable('order_items', ['id', 'order_id', 'product_id', 'quantity']);

    console.log('🎉 Migração concluída com sucesso!');
    process.exit(0);
  } catch (err) {
    console.error('Erro na migração:', err);
    process.exit(1);
  }
}

migrate();
