import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './db.js';
import rcaRoutes from './routes/rca.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());

// ── Serve frontend static files from /public ──────────────
app.use(express.static(path.join(__dirname, 'public')));
console.log('Serving static from:', path.join(__dirname, 'public'));
// ── API Routes ────────────────────────────────────────────
app.use('/rca', rcaRoutes);

// ── Health check ──────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// ── Fallback: send index.html for any unmatched route ─────
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 4300;

async function startServer() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 App running at http://localhost:${PORT}`);
    // console.log(`   API  →  http://localhost:${PORT}/rca`);
  });
}

startServer();