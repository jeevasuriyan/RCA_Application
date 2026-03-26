import express from 'express';
import { ObjectId } from 'mongodb';
import { getDb } from '../db.js';

const router = express.Router();

// ── Helper ────────────────────────────────────────────────
function isValidId(id) {
  return ObjectId.isValid(id);
}

// ── CREATE ────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const db   = getDb();
    const data = req.body;

    const dateStr = new Date().toISOString().split('T')[0]; // ✅ Fixed: was .toString()

    data.title     = `${data.clientName} — ${data.event?.product || 'N/A'} — ${dateStr}`;
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
router.put('/:id', async (req, res) => {
  try {
    if (!isValidId(req.params.id))
      return res.status(400).json({ error: 'Invalid ID' });

    const db = getDb(); // ✅ Fixed: was getDB()

    const result = await db.collection('rca').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { ...req.body, updatedAt: new Date() } }
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

    const db = getDb(); // ✅ Fixed: was getDB()

    const result = await db.collection('rca').deleteOne({
      _id: new ObjectId(req.params.id)
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