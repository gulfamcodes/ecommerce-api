const multer = require("multer");
const AppError = require("../utils/appError");

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new AppError("Only image files are allowed", 400), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limit: {
    fileSize: 5 * 1024 * 1024,
  },
});

module.exports = upload;
