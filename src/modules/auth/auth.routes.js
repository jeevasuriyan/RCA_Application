import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import express from 'express';
import { authenticate } from './auth.middleware.js';
import { UserModel } from './user.model.js';
import { signToken } from './jwt.utils.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await UserModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    console.log('[LOGIN DEBUG] user.isAdmin =', user.isAdmin, '| !!user.isAdmin =', !!user.isAdmin);
    const token = signToken({ id: user._id.toString(), email: user.email, name: user.name, isAdmin: !!user.isAdmin });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, isAdmin: !!user.isAdmin } });
  } catch (err) {
    console.error('POST /auth/login:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const user = await UserModel.findByEmail(email);
    if (!user) {
      return res.json({ message: 'If that email is registered, a reset link has been generated.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await UserModel.update(user._id.toString(), {
      resetPasswordToken: token,
      resetPasswordExpires: expires,
    });

    const resetUrl = `/auth/reset-password.html?token=${token}`;
    const fullUrl = `${req.protocol}://${req.get('host')}${resetUrl}`;

    console.log('');
    console.log(`🔑  Password reset requested for: ${email}`);
    console.log(`   Reset URL: ${fullUrl}`);
    console.log('');

    res.json({
      message: 'Reset link generated. Check the server console for the URL.',
      resetUrl: process.env.NODE_ENV !== 'production' ? resetUrl : undefined,
    });
  } catch (err) {
    console.error('POST /auth/forgot-password:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ error: 'Token and new password are required.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    const user = await UserModel.findByResetToken(token);
    if (!user) {
      return res.status(400).json({ error: 'This reset link is invalid or has expired.' });
    }

    const hashed = await bcrypt.hash(password, 12);
    await UserModel.update(user._id.toString(), {
      password: hashed,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    });

    res.json({ message: 'Password updated successfully. You can now log in.' });
  } catch (err) {
    console.error('POST /auth/reset-password:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    const existing = await UserModel.exists(email.trim());
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await UserModel.create({
      name: trimmedName,
      email: email.trim().toLowerCase(),
      password: hashed,
    });

    const token = signToken({ id: user._id.toString(), email: user.email, name: user.name, isAdmin: false });

    console.log(`\n✅  New user registered: ${user.email} (${user.name})\n`);
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, isAdmin: false } });
  } catch (err) {
    console.error('POST /auth/signup:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json({ id: user._id, name: user.name, email: user.email, isAdmin: !!user.isAdmin });
  } catch {
    res.status(500).json({ error: 'Server error.' });
  }
});

export default router;
