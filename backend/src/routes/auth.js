// ==============================================================================
// Auth Routes (routes/auth.js) - Simple & Inline Zod
// ==============================================================================
// We do Zod validation directly inside the route function so students can easily
// see what is happening without jumping between 5 different files!
// ==============================================================================

import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../db.js';
import auth from '../auth.js';

const router = express.Router();

// 1. Zod schema for registration
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

// Register: POST /api/auth/register
router.post('/register', async (req, res) => {
  // Validate request body directly using Zod
  const validation = registerSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: validation.error.errors[0].message });
  }

  const { name, email, password } = validation.data;

  // Check if user already exists
  const exists = await User.findOne({ where: { email } });
  if (exists) {
    return res.status(400).json({ error: 'Email is already registered' });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const user = await User.create({ name, email, password: hashedPassword });

  // Generate token
  const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'pulsewatch_secret', { expiresIn: '7d' });

  res.status(201).json({
    message: 'Registered successfully',
    token,
    user: { id: user.id, name: user.name, email: user.email }
  });
});

// 2. Zod schema for login
const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required')
});

// Login: POST /api/auth/login
router.post('/login', async (req, res) => {
  const validation = loginSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: validation.error.errors[0].message });
  }

  const { email, password } = validation.data;

  // Find user
  const user = await User.findOne({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Check password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Generate token
  const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'pulsewatch_secret', { expiresIn: '7d' });

  res.json({
    message: 'Logged in successfully',
    token,
    user: { id: user.id, name: user.name, email: user.email }
  });
});

// Get Profile: GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  const user = await User.findByPk(req.user.id, {
    attributes: ['id', 'name', 'email', 'createdAt']
  });
  res.json({ user });
});

export default router;
