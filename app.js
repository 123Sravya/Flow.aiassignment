const express = require('express');
const bodyParser = require('body-parser');
const db = require('./database');

const app = express();
app.use(bodyParser.json());

// Add new transaction
app.post('/transactions', (req, res) => {
  const { type, category, amount, date, description } = req.body;

  const query = `
    INSERT INTO transactions (type, category, amount, date, description)
    VALUES (?, ?, ?, ?, ?)
  `;
  
  db.run(query, [type, category, amount, date, description], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ id: this.lastID });
  });
});

// Get all transactions
app.get('/transactions', (req, res) => {
  const query = `SELECT * FROM transactions`;

  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ transactions: rows });
  });
});

// Get a single transaction by ID
app.get('/transactions/:id', (req, res) => {
  const { id } = req.params;
  const query = `SELECT * FROM transactions WHERE id = ?`;

  db.get(query, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    res.json({ transaction: row });
  });
});

// Update a transaction by ID
app.put('/transactions/:id', (req, res) => {
  const { id } = req.params;
  const { type, category, amount, date, description } = req.body;

  const query = `
    UPDATE transactions
    SET type = ?, category = ?, amount = ?, date = ?, description = ?
    WHERE id = ?
  `;
  
  db.run(query, [type, category, amount, date, description, id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    res.json({ message: "Transaction updated successfully" });
  });
});

// Delete a transaction by ID
app.delete('/transactions/:id', (req, res) => {
  const { id } = req.params;
  const query = `DELETE FROM transactions WHERE id = ?`;

  db.run(query, [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    res.json({ message: "Transaction deleted successfully" });
  });
});

// Get transaction summary
app.get('/summary', (req, res) => {
  const { startDate, endDate, category } = req.query;
  let query = `SELECT type, SUM(amount) as total FROM transactions WHERE 1=1`;
  let params = [];

  if (startDate && endDate) {
    query += ` AND date BETWEEN ? AND ?`;
    params.push(startDate, endDate);
  }

  if (category) {
    query += ` AND category = ?`;
    params.push(category);
  }

  query += ` GROUP BY type`;

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const income = rows.find(row => row.type === 'income')?.total || 0;
    const expenses = rows.find(row => row.type === 'expense')?.total || 0;
    const balance = income - expenses;

    res.json({ income, expenses, balance });
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
