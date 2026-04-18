import express from 'express';
import { authenticate } from '../auth/auth.middleware.js';
import { UserModel } from '../auth/user.model.js';
import { requireAdmin } from './admin.middleware.js';

const router = express.Router();

router.use(authenticate, requireAdmin);

router.get('/users', async (req, res) => {
  try {
    const users = await UserModel.getAllUsers();
    res.json(users);
  } catch (err) {
    console.error('GET /admin/users:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Cannot modify your own admin status.' });
    }
    const { isAdmin } = req.body;
    if (typeof isAdmin !== 'boolean') {
      return res.status(400).json({ error: 'isAdmin must be a boolean.' });
    }
    const user = await UserModel.update(id, { isAdmin });
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ id: user._id, name: user.name, email: user.email, isAdmin: !!user.isAdmin });
  } catch (err) {
    console.error('PUT /admin/users/:id:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account.' });
    }
    const deleted = await UserModel.deleteUser(id);
    if (!deleted) return res.status(404).json({ error: 'User not found.' });
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /admin/users/:id:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

export default router;
