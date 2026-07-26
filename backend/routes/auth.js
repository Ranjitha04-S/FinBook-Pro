const express   = require('express');
const router    = express.Router();
const jwt       = require('jsonwebtoken');
const bcrypt    = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const { body }  = require('express-validator');
const User      = require('../models/User');
const { validate } = require('../middleware/validate');

const SECRET = process.env.JWT_SECRET || 'srfinance_secret_key';

// ── Login rate limiter ───────────────────────────────────────────────────────
// Max 10 login attempts per IP per 15 minutes — prevents brute-force attacks
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please try again in 15 minutes.' },
});

// ── Validation rules ────────────────────────────────────────────────────────
const loginRules = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 4 }).withMessage('Password must be at least 4 characters'),
];

// POST /api/auth/login
router.post('/login', loginLimiter, loginRules, validate, async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username: username.trim() });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user._id, username: user.username },
      SECRET,
      { expiresIn: '8h' }
    );
    res.json({ token, username: user.username });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/verify
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
