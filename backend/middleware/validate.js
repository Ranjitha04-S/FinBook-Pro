const { validationResult } = require('express-validator');

/**
 * Run after express-validator checks.
 * Collects all errors and returns a structured 400 response.
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Build a field → message map so the frontend can highlight per-field
    const fields = {};
    errors.array().forEach(({ path, msg }) => {
      if (!fields[path]) fields[path] = msg;
    });
    return res.status(400).json({ message: 'Validation failed', errors: fields });
  }
  next();
}

module.exports = { validate };
