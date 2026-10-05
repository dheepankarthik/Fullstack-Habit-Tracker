import { requireAuth } from './auth.js';
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import db from './db.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from the server!' });
});

app.get('/api/habits', requireAuth, (req, res) => {
  const rows = db
    .prepare('SELECT * FROM habits WHERE user_id = ?')
    .all(req.userId);

  res.json(
    rows.map((row) => ({
      id: row.id,
      name: row.name,
      done: row.done === 1,
    }))
  );
});

// POST — create a habit for this user
app.post('/api/habits', requireAuth, (req, res) => {
  const { name } = req.body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Habit name is required' });
  }

  const info = db
    .prepare('INSERT INTO habits (user_id, name) VALUES (?, ?)')
    .run(req.userId, name.trim());

  const habit = db
    .prepare('SELECT * FROM habits WHERE id = ?')
    .get(info.lastInsertRowid);

  res.status(201).json({
    id: habit.id,
    name: habit.name,
    done: habit.done === 1,
  });
});

// PUT — toggle, but only if this user owns it
app.put('/api/habits/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);

  const habit = db
    .prepare('SELECT * FROM habits WHERE id = ? AND user_id = ?')
    .get(id, req.userId);

  if (!habit) {
    return res.status(404).json({ error: 'Habit not found' });
  }

  const newDone = habit.done === 1 ? 0 : 1;
  db.prepare('UPDATE habits SET done = ? WHERE id = ?').run(newDone, id);

  res.json({ id: habit.id, name: habit.name, done: newDone === 1 });
});

// DELETE — same ownership check
app.delete('/api/habits/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);

  const info = db
    .prepare('DELETE FROM habits WHERE id = ? AND user_id = ?')
    .run(id, req.userId);

  if (info.changes === 0) {
    return res.status(404).json({ error: 'Habit not found' });
  }

  res.status(204).end();
});

app.post('/api/auth/signup', async (req, res) => {
  const { email, password } = req.body;

  // 1. Validate presence
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  // 2. Validate types
  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Invalid input' });
  }

  // 3. Validate password length
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const cleanEmail = email.toLowerCase().trim();

  // 4. Check if email is already registered
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  // 5. Hash the password
  const hash = await bcrypt.hash(password, 10);

  // 6. Insert the user
  const info = db.prepare(
    'INSERT INTO users (email, password_hash) VALUES (?, ?)'
  ).run(cleanEmail, hash);

  // 7. Return the created user (never the hash!)
  res.status(201).json({
    id: info.lastInsertRowid,
    email: cleanEmail,
  });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const cleanEmail = email.toLowerCase().trim();

  // 1. Find the user
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail);
  if (!user) {
    // Return same error as wrong password — don't leak whether the email exists
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // 2. Compare the password with the hash
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // 3. Sign a JWT
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  // 4. Return the token and user info (never the hash)
  res.json({
    token,
    user: { id: user.id, email: user.email },
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});