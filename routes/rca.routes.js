import express    from 'express';
import multer     from 'multer';
import path       from 'path';
import fs         from 'fs';
import { fileURLToPath } from 'url';
import { ObjectId } from 'mongodb';
import { getDb }  from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const router = express.Router();

// ── Multer — save files to /public/uploads ────────────────
const UPLOAD_DIR = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename:    (_req, file,  cb) => {
    const safe = file.originalname.replace(/\s+/g, '_');
    cb(null, `${Date.now()}_${safe}`);
  },
});
const upload = multer({ storage });

// ── Helper ────────────────────────────────────────────────
function isValidId(id) {
  return ObjectId.isValid(id);
}

// ── Parse multipart body helper ───────────────────────────
// Frontend sends scalar fields as formData.append('data', JSON.stringify({...}))
// and files as emailImage_0, screenshot_0, closureImage_0, etc.
function parseUpload(req) {
  const fields = JSON.parse(req.body.data || '{}');
  const files  = req.files || [];

  const screenshots   = files.filter(f => f.fieldname.startsWith('screenshot'))
                             .map(f => f.filename);
  const emailImages   = files.filter(f => f.fieldname.startsWith('emailImage'))
                             .map(f => f.filename);
  const closureImages = files.filter(f => f.fieldname.startsWith('closureImage'))
                             .map(f => f.filename);

  return {
    ...fields,
    attachments: {
      screenshots,
      receivedEmails:   emailImages,
      responseClosures: closureImages,
    },
  };
}

// ── CREATE ────────────────────────────────────────────────
router.post('/', upload.any(), async (req, res) => {
  try {
    const db   = getDb();
    const data = parseUpload(req);

    const dateStr  = new Date().toISOString().split('T')[0];
    data.title     = `${data.clientName} — ${data.product || 'N/A'} — ${dateStr}`;
    data.createdAt = new Date();
    data.updatedAt = new Date();

    const result = await db.collection('rca').insertOne(data);
    res.status(201).json(result);
  } catch (err) {
    console.error('POST /rca error:', err);
    res.status(500).json({ error: 'Failed to create RCA' });
  }
});

// ── GET ALL ───────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const db     = getDb();
    const result = await db.collection('rca').find().sort({ createdAt: -1 }).toArray();
    res.json(result);
  } catch (err) {
    console.error('GET /rca error:', err);
    res.status(500).json({ error: 'Failed to fetch RCAs' });
  }
});

// ── GET ONE ───────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    if (!isValidId(req.params.id))
      return res.status(400).json({ error: 'Invalid ID' });

    const db   = getDb();
    const data = await db.collection('rca').findOne({ _id: new ObjectId(req.params.id) });

    if (!data) return res.status(404).json({ error: 'RCA not found' });
    res.json(data);
  } catch (err) {
    console.error('GET /rca/:id error:', err);
    res.status(500).json({ error: 'Failed to fetch RCA' });
  }
});

// ── UPDATE ────────────────────────────────────────────────
router.put('/:id', upload.any(), async (req, res) => {
  try {
    if (!isValidId(req.params.id))
      return res.status(400).json({ error: 'Invalid ID' });

    const db   = getDb();
    const data = parseUpload(req);

    // Merge attachments: new uploads take priority; fall back to explicitly kept existing filenames
    // (client sends existingEmailImage / existingClosureImage / existingScreenshots in the JSON payload)
    const hasExplicitExisting = 'existingEmailImages' in data || 'existingScreenshots' in data;

    if (hasExplicitExisting) {
      const keptEmail   = Array.isArray(data.existingEmailImages)   ? data.existingEmailImages   : [];
      const keptClosure = Array.isArray(data.existingClosureImages) ? data.existingClosureImages : [];
      const keptSS      = Array.isArray(data.existingScreenshots)   ? data.existingScreenshots   : [];
      data.attachments.receivedEmails   = [...keptEmail,   ...data.attachments.receivedEmails];
      data.attachments.responseClosures = [...keptClosure, ...data.attachments.responseClosures];
      data.attachments.screenshots      = [...keptSS,      ...data.attachments.screenshots];
    } else {
      const existing = await db.collection('rca').findOne(
        { _id: new ObjectId(req.params.id) }, { projection: { attachments: 1 } }
      );
      if (data.attachments.receivedEmails.length   === 0) data.attachments.receivedEmails   = existing?.attachments?.receivedEmails   ?? [];
      if (data.attachments.responseClosures.length === 0) data.attachments.responseClosures = existing?.attachments?.responseClosures ?? [];
      if (data.attachments.screenshots.length      === 0) data.attachments.screenshots      = existing?.attachments?.screenshots      ?? [];
    }

    // Clean up helper fields before saving
    delete data.existingEmailImages;
    delete data.existingClosureImages;
    delete data.existingScreenshots;

    const result = await db.collection('rca').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { ...data, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0)
      return res.status(404).json({ error: 'RCA not found' });

    res.json(result);
  } catch (err) {
    console.error('PUT /rca/:id error:', err);
    res.status(500).json({ error: 'Failed to update RCA' });
  }
});

// ── DELETE ────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    if (!isValidId(req.params.id))
      return res.status(400).json({ error: 'Invalid ID' });

    const db = getDb();

    const result = await db.collection('rca').deleteOne({
      _id: new ObjectId(req.params.id),
    });

    if (result.deletedCount === 0)
      return res.status(404).json({ error: 'RCA not found' });

    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /rca/:id error:', err);
    res.status(500).json({ error: 'Failed to delete RCA' });
  }
});

export default router;