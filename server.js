import 'dotenv/config';
import express from 'express';
import cors    from 'cors';
import path    from 'path';
import { fileURLToPath } from 'url';

import { connectDB }   from './db.js';
import rcaRoutes       from './routes/rca.routes.js';
import authRoutes      from './auth/routes/auth.routes.js';
import { seedDefaultUser } from './auth/utils/seed.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());

// ── Static files ──────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── API Routes ────────────────────────────────────────────
app.use('/auth', authRoutes);
app.use('/rca',  rcaRoutes);

// ── Health check ──────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// ── SPA fallback ──────────────────────────────────────────
// Auth pages are served as static files above.
// Everything else gets index.html (the main SPA).
app.get('/{*path}', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 4300;

async function startServer() {
  await connectDB();
  await seedDefaultUser();
  app.listen(PORT, () => {
    console.log(`🚀 App running at http://localhost:${PORT}`);
  });
}

startServer();
