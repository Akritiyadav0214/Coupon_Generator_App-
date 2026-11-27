const { AppError } = require('../utils/errors');

const notFoundHandler = (req, _res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404, 'NOT_FOUND'));
};

const errorHandler = (err, _req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let code = err.code || 'INTERNAL_ERROR';
  let message = err.message || 'An unexpected error occurred';
  let details = err.details || null;

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    code = 'DUPLICATE_RESOURCE';
    const fields = Object.keys(err.keyPattern || {});
    if (fields.includes('email')) {
      message = 'An account with this email already exists.';
    } else if (fields.includes('studentId')) {
      message = 'An account with this Student ID already exists.';
    } else if (fields.includes('couponDate') && fields.includes('student')) {
      message = 'You have already generated your lunch coupon for today.';
      code = 'COUPON_ALREADY_EXISTS';
    } else if (fields.includes('date') && fields.includes('mealType')) {
      message = 'A menu already exists for this date and meal type.';
    } else {
      message = 'This record already exists.';
    }
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    const firstErr = Object.values(err.errors)[0];
    message = firstErr ? firstErr.message : 'Validation failed.';
  }

  // Mongoose invalid ObjectId
  if (err.name === 'CastError') {
    statusCode = 400;
    code = 'INVALID_ID';
    message = 'Invalid identifier format.';
  }

  const isProd = process.env.NODE_ENV === 'production';

  if (statusCode >= 500 && isProd) {
    message = 'Internal server error. Please try again later.';
    details = null;
  }

  if (statusCode >= 500) {
    console.error('[Server Error]', err);
  }

  const payload = {
    success: false,
    code,
    message,
  };

  if (details) payload.details = details;
  if (!isProd && statusCode >= 500) {
    payload.stack = err.stack;
  }

  res.status(statusCode).json(payload);
};

module.exports = { notFoundHandler, errorHandler };
