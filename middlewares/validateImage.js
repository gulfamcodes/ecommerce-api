const AppError = require("../utils/appError");

const validateImage = async (req, res, next) => {
  try {
    if (!req.file) return next();

    const { fileTypeFromBuffer } = await import("file-type");

    const fileType = await fileTypeFromBuffer(req.file.buffer);

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!fileType || !allowedTypes.includes(fileType.mime)) {
      return next(
        new AppError("Only JPG, PNG, and Webp images are allowed", 400),
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = validateImage;
