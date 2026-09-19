// Geo-Farm Field Scout — minimal MVP backend.
// Stores field reports so a future Government Officer portal can read them.
// JSON-file persistence is enough for this hackathon stage — no database yet.

import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, 'data', 'reports.json');
const MISSIONS_FILE = path.join(__dirname, 'data', 'missions.json');

const app = express();
app.use(cors());
app.use(express.json());

function readJSON(file) {
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'geo-farm-api' });
});

app.get('/api/missions', (req, res) => {
  res.json(readJSON(MISSIONS_FILE));
});

app.get('/api/reports', (req, res) => {
  res.json(readJSON(DATA_FILE));
});

app.get('/api/reports/:id', (req, res) => {
  const reports = readJSON(DATA_FILE);
  const report = reports.find((r) => r.id === req.params.id);
  if (!report) return res.status(404).json({ error: 'Report not found' });
  res.json(report);
});

app.post('/api/reports', (req, res) => {
  const report = req.body;
  if (!report || !report.id) {
    return res.status(400).json({ error: 'Report must include an id' });
  }
  const reports = readJSON(DATA_FILE);
  const existingIndex = reports.findIndex((r) => r.id === report.id);
  if (existingIndex >= 0) {
    reports[existingIndex] = { ...reports[existingIndex], ...report };
  } else {
    reports.unshift(report);
  }
  writeJSON(DATA_FILE, reports);
  res.status(201).json(report);
});

app.patch('/api/reports/:id/status', (req, res) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'status is required' });

  const reports = readJSON(DATA_FILE);
  const report = reports.find((r) => r.id === req.params.id);
  if (!report) return res.status(404).json({ error: 'Report not found' });

  report.status = status;
  writeJSON(DATA_FILE, reports);
  res.json(report);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Geo-Farm API running on http://localhost:${PORT}`);
});
