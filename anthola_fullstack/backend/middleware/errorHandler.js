function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error';
  const code = err.code || 'INTERNAL_SERVER_ERROR';

  const payload = {
    success: false,
    error: {
      code,
      message,
      details: err.details || null,
    },
  };

  if (process.env.NODE_ENV !== 'production') {
    payload.error.stack = err.stack;
  }

  res.status(statusCode).json(payload);
}

module.exports = errorHandler;
