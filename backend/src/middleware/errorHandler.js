// Global error handler
const errorHandler = (err, req, res, next) => {
  console.error(`❌ Error: ${err.message}`);
  console.error(err.stack);
  
  const statusCode = err.statusCode || 500;
  const errorResponse = {
    error: 'Failed to fetch data',
    message: err.message,
    timestamp: new Date().toISOString(),
    path: req.path
  };
  
  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }
  
  res.status(statusCode).json(errorResponse);
};

module.exports = errorHandler;