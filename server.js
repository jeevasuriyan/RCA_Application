import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './src/config/db.js';
import adminRoutes from './src/modules/admin/admin.routes.js';
import authRoutes from './src/modules/auth/auth.routes.js';
import { seedDefaultUser } from './src/modules/auth/seed.js';
import rcaRoutes from './src/modules/rca/rca.routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, 'public');
const PORT = process.env.PORT || 4300;

await connectDB();
await seedDefaultUser();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(publicDir));
app.use('/auth', authRoutes);
app.use('/rca', rcaRoutes);
app.use('/admin', adminRoutes);
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.get('/{*path}', (_req, res) => res.sendFile(path.join(publicDir, 'index.html')));

app.listen(PORT, () => console.log(`App running at http://localhost:${PORT}`));
