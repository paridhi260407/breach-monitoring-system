const config = require('../config/env');

const errorHandler = (err, req, res, next) => {
  console.error('[Error Handler]:', err);

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: message,
    stack: config.nodeEnv === 'development' ? err.stack : undefined,
  });
};

const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: `Resource not found - ${req.originalUrl}`,
  });
};

module.exports = { errorHandler, notFoundHandler };
