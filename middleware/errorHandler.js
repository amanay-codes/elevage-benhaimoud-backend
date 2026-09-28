// middleware/errorHandler.js
// Global error handler — catches all errors thrown in controllers




const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || "Something went wrong on the server";
  if (err.name === "MulterError") {
    statusCode = 400;
    message = "Upload rejected. Check the file size and number of files.";
  }
  if (statusCode >= 500) {
    console.error(err);
    message = "Something went wrong on the server.";
  }

  // Mongoose: duplicate key (e.g. duplicate horse name/slug)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    message = `A record with this ${field} already exists.`;
    statusCode = 400;
  }

  // Mongoose: validation error
  if (err.name === "ValidationError") {
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(". ");
    statusCode = 400;
  }

  // Mongoose: invalid ObjectId (e.g. /horses/not-a-valid-id)
  if (err.name === "CastError") {
    message = "Resource not found.";
    statusCode = 404;
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    message = "Invalid token.";
    statusCode = 401;
  }
  if (err.name === "TokenExpiredError") {
    message = "Token expired. Please log in again.";
    statusCode = 401;
  }

  res.status(statusCode).json({
    success: false,
    message,
    // Show stack trace only in development
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = errorHandler;
