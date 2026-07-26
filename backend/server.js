const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const authMiddleware = require('./middleware/auth');

// ── CORS ─────────────────────────────────────────────────────────────────────
// In development, allow localhost:3000.
// In production, set FRONTEND_URL in .env to your deployed frontend origin.
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// ── Global rate limiter (all routes) ─────────────────────────────────────────
// Max 200 requests per IP per 15 minutes — prevents general abuse
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests from this IP, please try again later.' },
});
app.use(globalLimiter);

app.use(express.json());

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/sr-finance')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

// Public route — no auth required (login rate-limiting is in routes/auth.js)
app.use('/api/auth', require('./routes/auth'));

// Protected routes — all require valid JWT
app.use('/api/customers',     authMiddleware, require('./routes/customers'));
app.use('/api/entries',       authMiddleware, require('./routes/entries'));
app.use('/api/notifications', authMiddleware, require('./routes/notifications'));
app.use('/api/dashboard',     authMiddleware, require('./routes/dashboard'));
app.use('/api/reports',       authMiddleware, require('./routes/reports'));

// Cron job: generate notifications daily at 8 AM IST (Asia/Kolkata)
cron.schedule('0 8 * * *', async () => {
  const { generateNotifications } = require('./controllers/notificationController');
  await generateNotifications();
  console.log('[CRON] Notifications generated — IST 8:00 AM');
}, {
  scheduled: true,
  timezone: 'Asia/Kolkata',
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
