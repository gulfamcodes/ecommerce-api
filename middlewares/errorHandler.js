const AppError = require("../utils/appError");
const multer = require("multer");

const handleInvalidJSON = () => {
  return new AppError("Invalid JSON format in request body.", 400);
};

const handleJWTError = () => {
  return new AppError("Invalid token, please login again.", 401);
};

const handleJWTExpiredError = () => {
  return new AppError("Your token has expired. Please login again.", 401);
};

const handleDuplicateFieldsDB = () => {
  return new AppError("Duplicate value, please use another value.", 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);

  return new AppError(`Invalid input data. ${errors.join(". ")}`, 400);
};

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }

  console.error("Error 💥", err);

  return res.status(500).json({
    status: "error",
    message: "Something went wrong!",
  });
};

const handleCastErrorDB = () => {
  return new AppError("Invalid ID format.", 400);
};

module.exports = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      err = new AppError("File size must not exceed 5 MB", 413);
    }
  }

  if (err.type === "entity.parse.failed") {
    err = handleInvalidJSON();
  } else if (err.name === "JsonWebTokenError") {
    err = handleJWTError();
  } else if (err.name === "TokenExpiredError") {
    err = handleJWTExpiredError();
  } else if (err.code === 11000) {
    err = handleDuplicateFieldsDB();
  } else if (err.name === "ValidationError") {
    err = handleValidationErrorDB(err);
  } else if (err.name === "CastError") {
    err = handleCastErrorDB();
  }

  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    return sendErrorDev(err, res);
  }

  if (process.env.NODE_ENV === "production") {
    return sendErrorProd(err, res);
  }

  return res.status(500).json({
    status: "error",
    message: "Server configuration error",
  });
};
