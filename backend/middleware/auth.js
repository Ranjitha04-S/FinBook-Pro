const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'srfinance_secret_key';

module.exports = function authMiddleware(req, res, next) {
  const header = req.headers['authorization'];
  if (!header) return res.status(401).json({ error: 'No token, access denied' });

  const token = header.split(' ')[1]; // "Bearer <token>"
  if (!token) return res.status(401).json({ error: 'Malformed token' });

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded; // attach user info to every request
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token is invalid or expired' });
  }
};
