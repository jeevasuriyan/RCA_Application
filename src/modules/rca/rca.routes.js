import express from 'express';
import multer from 'multer';
import { ObjectId } from 'mongodb';
import { getDb } from '../../config/db.js';
import { authenticate } from '../auth/auth.middleware.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

function isValidId(id) {
  return ObjectId.isValid(id);
}

function parseUpload(req) {
  const fields = JSON.parse(req.body.data || '{}');
  const files = req.files || [];

  function toBase64Obj(file) {
    return {
      name: file.originalname,
      data: `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
    };
  }

  const screenshots = files.filter(file => file.fieldname.startsWith('screenshot')).map(toBase64Obj);
  const emailImages = files.filter(file => file.fieldname.startsWith('emailImage')).map(toBase64Obj);
  const closureImages = files.filter(file => file.fieldname.startsWith('closureImage')).map(toBase64Obj);

  return {
    ...fields,
    attachments: {
      screenshots,
      receivedEmails: emailImages,
      responseClosures: closureImages,
    },
  };
}

router.post('/', authenticate, upload.any(), async (req, res) => {
  try {
    const db = getDb();
    const data = parseUpload(req);
    const dateStr = new Date().toISOString().split('T')[0];

    data.title = `${data.clientName} — ${data.product || 'N/A'} — ${dateStr}`;
    data.createdAt = new Date();
    data.updatedAt = new Date();

    const result = await db.collection('rca').insertOne(data);
    res.status(201).json(result);
  } catch (err) {
    console.error('POST /rca error:', err);
    res.status(500).json({ error: 'Failed to create RCA' });
  }
});

router.get('/', authenticate, async (_req, res) => {
  try {
    const db = getDb();
    const result = await db.collection('rca').find().sort({ createdAt: -1 }).toArray();
    res.json(result);
  } catch (err) {
    console.error('GET /rca error:', err);
    res.status(500).json({ error: 'Failed to fetch RCAs' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid ID' });
    }

    const db = getDb();
    const data = await db.collection('rca').findOne({ _id: new ObjectId(req.params.id) });

    if (!data) {
      return res.status(404).json({ error: 'RCA not found' });
    }
    res.json(data);
  } catch (err) {
    console.error('GET /rca/:id error:', err);
    res.status(500).json({ error: 'Failed to fetch RCA' });
  }
});

router.put('/:id', authenticate, upload.any(), async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid ID' });
    }

    const db = getDb();
    const data = parseUpload(req);
    const hasExplicitExisting = 'existingEmailImages' in data || 'existingScreenshots' in data;

    if (hasExplicitExisting) {
      const keptEmailNames = Array.isArray(data.existingEmailImages) ? data.existingEmailImages : [];
      const keptClosureNames = Array.isArray(data.existingClosureImages) ? data.existingClosureImages : [];
      const keptSSNames = Array.isArray(data.existingScreenshots) ? data.existingScreenshots : [];

      const existing = await db.collection('rca').findOne(
        { _id: new ObjectId(req.params.id) },
        { projection: { attachments: 1 } }
      );

      function keepByName(existingArr, keptNames) {
        const arr = Array.isArray(existingArr) ? existingArr : [];
        return keptNames
          .map(name => arr.find(item => (typeof item === 'object' ? item.name : item) === name))
          .filter(Boolean);
      }

      data.attachments.receivedEmails = [
        ...keepByName(existing?.attachments?.receivedEmails, keptEmailNames),
        ...data.attachments.receivedEmails,
      ];
      data.attachments.responseClosures = [
        ...keepByName(existing?.attachments?.responseClosures, keptClosureNames),
        ...data.attachments.responseClosures,
      ];
      data.attachments.screenshots = [
        ...keepByName(existing?.attachments?.screenshots, keptSSNames),
        ...data.attachments.screenshots,
      ];
    } else {
      const existing = await db.collection('rca').findOne(
        { _id: new ObjectId(req.params.id) },
        { projection: { attachments: 1 } }
      );
      if (data.attachments.receivedEmails.length === 0) {
        data.attachments.receivedEmails = existing?.attachments?.receivedEmails ?? [];
      }
      if (data.attachments.responseClosures.length === 0) {
        data.attachments.responseClosures = existing?.attachments?.responseClosures ?? [];
      }
      if (data.attachments.screenshots.length === 0) {
        data.attachments.screenshots = existing?.attachments?.screenshots ?? [];
      }
    }

    delete data.existingEmailImages;
    delete data.existingClosureImages;
    delete data.existingScreenshots;

    const result = await db.collection('rca').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { ...data, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'RCA not found' });
    }

    res.json(result);
  } catch (err) {
    console.error('PUT /rca/:id error:', err);
    res.status(500).json({ error: 'Failed to update RCA' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required.' });
    }

    if (!isValidId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid ID' });
    }

    const db = getDb();
    const result = await db.collection('rca').deleteOne({ _id: new ObjectId(req.params.id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'RCA not found' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /rca/:id error:', err);
    res.status(500).json({ error: 'Failed to delete RCA' });
  }
});

export default router;
