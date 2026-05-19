const express = require('express');
const cors = require('cors');
const { db, initDatabase } = require('./database');
const entriesRouter = require('./routes/entries');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

initDatabase();

app.use('/api/entries', entriesRouter);

app.get('/api/stats', (req, res) => {
  db.all('SELECT * FROM entries ORDER BY date ASC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    const totalEntries = rows.length;
    const totalHours = rows.reduce((sum, r) => sum + (r.study_hours || 0), 0);
    const totalCommits = rows.reduce((sum, r) => sum + (r.commits || 0), 0);
    const avgProductivity = rows.length
      ? rows.reduce((sum, r) => sum + (r.productivity || 0), 0) / rows.length
      : 0;

    let streak = 0;
    if (rows.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dates = [...new Set(rows.map(r => r.date))].sort().reverse();

      let cursor = new Date(today);
      for (const dateStr of dates) {
        const d = new Date(dateStr + 'T00:00:00');
        const diffDays = Math.round((cursor - d) / 86400000);
        if (diffDays === 0 || diffDays === 1) {
          streak++;
          cursor = d;
        } else {
          break;
        }
      }
    }

    const techMap = {};
    rows.forEach(r => {
      if (r.technologies) {
        r.technologies.split(',').map(t => t.trim()).filter(Boolean).forEach(t => {
          techMap[t] = (techMap[t] || 0) + 1;
        });
      }
    });
    const topTechnologies = Object.entries(techMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    res.json({
      totalEntries,
      totalHours: Math.round(totalHours * 10) / 10,
      totalCommits,
      streak,
      avgProductivity: Math.round(avgProductivity * 10) / 10,
      topTechnologies
    });
  });
});

app.get('/api/export', (req, res) => {
  db.all('SELECT * FROM entries ORDER BY date DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=dev-journal-export.json');
    res.json({ exported_at: new Date().toISOString(), total: rows.length, entries: rows });
  });
});

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

app.listen(PORT, () => {
  console.log(`Dev Journal API running on http://localhost:${PORT}`);
});
