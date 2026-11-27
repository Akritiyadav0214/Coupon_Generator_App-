const { validationResult } = require('express-validator');
const { AppError } = require('../utils/errors');

const validate = (req, _res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map((e) => ({
      field: e.path,
      message: e.msg,
    }));
    return next(new AppError(formatted[0].message, 400, 'VALIDATION_ERROR', formatted));
  }
  return next();
};

/**
 * Recursively strips keys starting with '$' or containing '.' from objects
 * to mitigate MongoDB operator injection on request bodies.
 */
function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeObject);

  const clean = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith('$') || key.includes('.')) continue;
    clean[key] = sanitizeObject(value);
  }
  return clean;
}

const sanitizeBody = (req, _res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  next();
};

module.exports = { validate, sanitizeBody };
