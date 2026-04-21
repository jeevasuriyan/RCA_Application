import express from 'express';
import multer from 'multer';
import { ObjectId } from 'mongodb';
import { getDb } from '../../config/db.js';
import { authenticate } from '../auth/auth.middleware.js';
import { sendNewRCANotification, sendAssignmentNotification } from '../mailer/mailer.js';

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

    // Fire-and-forget: notify team and assignee (non-blocking)
    sendNewRCANotification(data).catch(err => console.error('Mail error (new RCA):', err));
    if (data.assignee?.email) {
      sendAssignmentNotification(data, data.assignee).catch(err => console.error('Mail error (assignment):', err));
    }
  } catch (err) {
    console.error('POST /rca error:', err);
    res.status(500).json({ error: 'Failed to create RCA' });
  }
});

router.get('/stats', async (_req, res) => {
  try {
    const db = getDb();
    const all = await db.collection('rca')
      .find({}, { projection: { priority: 1, clientName: 1, product: 1, createdAt: 1, title: 1 } })
      .sort({ createdAt: -1 })
      .toArray();

    const p = (v) => (v || '').toLowerCase();
    const critical = all.filter(r => p(r.priority) === 'critical').length;
    const high     = all.filter(r => p(r.priority) === 'high').length;
    const medium   = all.filter(r => p(r.priority) === 'medium').length;
    const total    = all.length;
    const latest   = all[0] || null;

    res.json({ critical, high, medium, total, latest });
  } catch (err) {
    console.error('GET /rca/stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
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

    // Capture existing assignee before update to detect changes
    const existingRca = await db.collection('rca').findOne(
      { _id: new ObjectId(req.params.id) },
      { projection: { assignee: 1, attachments: 1, clientName: 1, priority: 1, title: 1, createdAt: 1 } }
    );
    const prevAssigneeId = existingRca?.assignee?.id || null;
    const newAssigneeId = data.assignee?.id || null;

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

    // Fire assignment email only when assignee is newly set or changed
    const assigneeChanged = newAssigneeId && newAssigneeId !== prevAssigneeId;
    if (assigneeChanged && data.assignee?.email) {
      const updatedRca = { ...existingRca, ...data };
      sendAssignmentNotification(updatedRca, data.assignee).catch(err => console.error('Mail error (assignment update):', err));
    }
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
