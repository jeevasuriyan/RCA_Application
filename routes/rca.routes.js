import express    from 'express';
import multer     from 'multer';
import { ObjectId } from 'mongodb';
import { getDb }  from '../db.js';
import { authenticate } from '../auth/middleware/auth.middleware.js';

const router = express.Router();

// ── Multer — store files in memory; we save as base64 to DB ──
const upload = multer({ storage: multer.memoryStorage() });

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

  function toBase64Obj(f) {
    return {
      name: f.originalname,
      data: `data:${f.mimetype};base64,${f.buffer.toString('base64')}`,
    };
  }

  const screenshots   = files.filter(f => f.fieldname.startsWith('screenshot'))
                             .map(toBase64Obj);
  const emailImages   = files.filter(f => f.fieldname.startsWith('emailImage'))
                             .map(toBase64Obj);
  const closureImages = files.filter(f => f.fieldname.startsWith('closureImage'))
                             .map(toBase64Obj);

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
router.post('/', authenticate, upload.any(), async (req, res) => {
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
router.get('/', authenticate, async (_req, res) => {
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
router.get('/:id', authenticate, async (req, res) => {
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
router.put('/:id', authenticate, upload.any(), async (req, res) => {
  try {
    if (!isValidId(req.params.id))
      return res.status(400).json({ error: 'Invalid ID' });

    const db   = getDb();
    const data = parseUpload(req);

    // Merge attachments: new uploads take priority; fall back to explicitly kept existing entries.
    // Client sends existingEmailImages / existingClosureImages / existingScreenshots as name arrays.
    // We look up the full { name, data } objects from the current DB record so base64 is preserved.
    const hasExplicitExisting = 'existingEmailImages' in data || 'existingScreenshots' in data;

    if (hasExplicitExisting) {
      const keptEmailNames   = Array.isArray(data.existingEmailImages)   ? data.existingEmailImages   : [];
      const keptClosureNames = Array.isArray(data.existingClosureImages) ? data.existingClosureImages : [];
      const keptSSNames      = Array.isArray(data.existingScreenshots)   ? data.existingScreenshots   : [];

      const existing = await db.collection('rca').findOne(
        { _id: new ObjectId(req.params.id) }, { projection: { attachments: 1 } }
      );

      // Match kept names to their stored objects (supports both {name,data} and legacy string formats)
      function keepByName(existingArr, keptNames) {
        const arr = Array.isArray(existingArr) ? existingArr : [];
        return keptNames.map(n =>
          arr.find(item => (typeof item === 'object' ? item.name : item) === n)
        ).filter(Boolean);
      }

      data.attachments.receivedEmails   = [...keepByName(existing?.attachments?.receivedEmails,   keptEmailNames),   ...data.attachments.receivedEmails];
      data.attachments.responseClosures = [...keepByName(existing?.attachments?.responseClosures, keptClosureNames), ...data.attachments.responseClosures];
      data.attachments.screenshots      = [...keepByName(existing?.attachments?.screenshots,      keptSSNames),      ...data.attachments.screenshots];
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
router.delete('/:id', authenticate, async (req, res) => {
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