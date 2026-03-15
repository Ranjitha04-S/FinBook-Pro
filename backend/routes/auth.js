const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const ADMIN = { username: 'sudhan', password: 'Sudhan@21' };
const SECRET = process.env.JWT_SECRET || 'srfinance_secret_key';

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN.username && password === ADMIN.password) {
    const token = jwt.sign({ username }, SECRET, { expiresIn: '30d' });
    res.json({ token, username });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

router.get('/verify', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token' });
  try {
    const decoded = jwt.verify(token, SECRET);
    res.json({ valid: true, user: decoded });
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
});

module.exports = router;
