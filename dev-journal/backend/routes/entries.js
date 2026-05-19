const express = require('express');
const router = express.Router();
const { db } = require('../database');

function validate(body, res) {
  const { date, title, summary, productivity, study_hours, commits } = body;
  if (!date || !title || !summary)
    return res.status(400).json({ error: 'date, title e summary são obrigatórios' });
  if (productivity !== undefined && (productivity < 1 || productivity > 5))
    return res.status(400).json({ error: 'productivity deve ser entre 1 e 5' });
  if (study_hours !== undefined && study_hours < 0)
    return res.status(400).json({ error: 'study_hours deve ser >= 0' });
  if (commits !== undefined && commits < 0)
    return res.status(400).json({ error: 'commits deve ser >= 0' });
  return null;
}

// GET /api/entries
router.get('/', (req, res) => {
  const { technology, date, productivity, mood, search } = req.query;

  let query = 'SELECT * FROM entries WHERE 1=1';
  const params = [];

  if (technology) {
    query += ' AND technologies LIKE ?';
    params.push(`%${technology}%`);
  }
  if (date) {
    query += ' AND date = ?';
    params.push(date);
  }
  if (productivity) {
    query += ' AND productivity = ?';
    params.push(parseInt(productivity));
  }
  if (mood) {
    query += ' AND mood LIKE ?';
    params.push(`%${mood}%`);
  }
  if (search) {
    query += ' AND (title LIKE ? OR summary LIKE ? OR technologies LIKE ? OR learnings LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY date DESC, id DESC';

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// GET /api/entries/:id
router.get('/:id', (req, res) => {
  db.get('SELECT * FROM entries WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Registro não encontrado' });
    res.json(row);
  });
});

// POST /api/entries
router.post('/', (req, res) => {
  const invalid = validate(req.body, res);
  if (invalid) return;

  const { date, title, summary, technologies = '', challenges = '', learnings = '',
    study_hours = 0, links = '', commits = 0, productivity = 3, mood = '' } = req.body;

  db.run(
    `INSERT INTO entries (date, title, summary, technologies, challenges, learnings, study_hours, links, commits, productivity, mood)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [date, title, summary, technologies, challenges, learnings, study_hours, links, commits, productivity, mood],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      db.get('SELECT * FROM entries WHERE id = ?', [this.lastID], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json(row);
      });
    }
  );
});

// PUT /api/entries/:id
router.put('/:id', (req, res) => {
  const invalid = validate(req.body, res);
  if (invalid) return;

  const { date, title, summary, technologies = '', challenges = '', learnings = '',
    study_hours = 0, links = '', commits = 0, productivity = 3, mood = '' } = req.body;

  db.run(
    `UPDATE entries SET date=?, title=?, summary=?, technologies=?, challenges=?, learnings=?,
     study_hours=?, links=?, commits=?, productivity=?, mood=? WHERE id=?`,
    [date, title, summary, technologies, challenges, learnings, study_hours, links, commits, productivity, mood, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Registro não encontrado' });
      db.get('SELECT * FROM entries WHERE id = ?', [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row);
      });
    }
  );
});

// DELETE /api/entries/:id
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM entries WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Registro não encontrado' });
    res.json({ message: 'Registro excluído com sucesso' });
  });
});

module.exports = router;
