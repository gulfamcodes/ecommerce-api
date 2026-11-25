const cloudinary = require("../utils/cloudinary");
const uploadToCloudinary = require("../utils/uploadToCloudinary");
const Product = require("../models/productModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.getAllProducts = catchAsync(async (req, res, next) => {
  // filtering
  const queryObj = { ...req.query };

  const excludedFields = ["sort", "page", "limit", "fields", "search"];
  excludedFields.forEach((x) => delete queryObj[x]);
  const operators = JSON.stringify(queryObj).replace(
    /\b(gt|gte|lt|lte)\b/g,
    (match) => `$${match}`,
  );

  const filter = JSON.parse(operators);
  filter.isDeleted = { $ne: true };
  const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\] /g, "\\$&");
  //implementing search feature
  if (req.query.search) {
    const searchTerm = escapeRegex(String(req.query.search));
    filter.$or = [
      { name: { $regex: searchTerm, $options: "i" } },
      { description: { $regex: searchTerm, $options: "i" } },
    ];
  }

  const totalProducts = await Product.countDocuments(filter);
  let query = Product.find(filter);

  // sorting
  if (req.query.sort) {
    query = query.sort(req.query.sort.split(",").join(" "));
  }

  // field limiting
  if (req.query.fields) {
    query = query.select(req.query.fields.split(",").join(" "));
  }

  // pagination

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.max(1, Number(req.query.limit) || 10);
  const skip = (page - 1) * limit;
  query = query.skip(skip).limit(limit);

  const totalPages = Math.ceil(totalProducts / limit);

  // console.log(query);
  const products = await query;

  res.status(200).json({
    status: "success",
    results: products.length,
    pagination: {
      totalProducts,
      currentPage: page,
      totalPages,
      limit,
    },
    data: { products },
  });
});

exports.getProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findOne({
    _id: req.params.id,
    isDeleted: { $ne: true },
  });

  if (!product) {
    return next(new AppError("Product not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: { product },
  });
});

exports.createProduct = catchAsync(async (req, res, next) => {
  const { name, description, price, category, countInStock } = req.body;

  if (
    typeof name !== "string" ||
    !name?.trim() ||
    typeof category !== "string" ||
    !category?.trim() ||
    price === undefined ||
    price === ""
  ) {
    return next(new AppError("Name, category and price are required", 400));
  }

  if (description !== undefined && typeof description !== "string") {
    return next(new AppError("Description must be string", 400));
  }

  const parsedPrice = Number(price);
  const parsedStock = countInStock === undefined ? 0 : Number(countInStock);

  if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
    return next(new AppError("Price must be a valid non-negative number", 400));
  }

  if (!Number.isInteger(parsedStock) || parsedStock < 0) {
    return next(new AppError("Stock must be a non-negative integer", 400));
  }

  let uploadedImage;

  try {
    // upload image if provided
    if (req.file) {
      uploadedImage = await uploadToCloudinary(req.file.buffer);
    }

    const productData = {
      name: name.trim(),
      description,
      category: category.trim(),
      price: parsedPrice,
      countInStock: parsedStock,
    };

    if (uploadedImage) {
      productData.image = uploadedImage.secure_url;
      productData.imagePublicId = uploadedImage.public_id;
    }

    const product = await Product.create(productData);

    res.status(201).json({
      status: "success",
      data: { product },
    });
  } catch (error) {
    // Remove uploaded image if database creation failed

    if (uploadedImage) {
      try {
        await cloudinary.uploader.destroy(uploadedImage.public_id);
      } catch (cleanupError) {
        console.error("Cloudinary cleanup failed:", cleanupError.message);
      }
    }
    throw error;
  }
});

exports.updateProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findOne({
    _id: req.params.id,
    isDeleted: { $ne: true },
  });
  if (!product) return next(new AppError("Product not found", 404));

  const { name, description, category, price, countInStock } = req.body;

  // Build an allowlisted update object

  const updates = {};

  if (name !== undefined) {
    if (typeof name !== "string" || !name?.trim()) {
      return next(new AppError("Name must be non-empty string", 400));
    }

    updates.name = name.trim();
  }

  if (category !== undefined) {
    if (typeof category !== "string" || !category?.trim()) {
      return next(new AppError("Category must be non empty string", 400));
    }

    updates.category = category.trim();
  }

  if (description !== undefined) {
    if (typeof description !== "string") {
      return next(new AppError("Description must be a string", 400));
    }

    updates.description = description.trim();
  }

  if (countInStock !== undefined) {
    const parsedStock = Number(countInStock);
    if (
      (typeof countInStock === "string" && !countInStock.trim()) ||
      countInStock === "" ||
      !Number.isInteger(parsedStock) ||
      parsedStock < 0
    ) {
      return next(new AppError("Stock must be non-negative integer", 400));
    }
    updates.countInStock = parsedStock;
  }

  if (price !== undefined) {
    const parsedPrice = Number(price);
    if (
      (typeof price === "string" && !price.trim()) ||
      !Number.isFinite(parsedPrice) ||
      parsedPrice < 0
    ) {
      return next(
        new AppError("Price must be a valid non-negative number", 400),
      );
    }
    updates.price = parsedPrice;
  }

  if (Object.keys(updates).length === 0 && !req.file) {
    return next(new AppError("No valid product updates provided", 400));
  }

  let uploadedImage;
  const oldImagePublicId = product.imagePublicId;

  try {
    if (req.file) {
      uploadedImage = await uploadToCloudinary(req.file.buffer);

      updates.image = uploadedImage.secure_url;
      updates.imagePublicId = uploadedImage.public_id;
    }

    Object.assign(product, updates);

    await product.save();
    // Delete old images only after successful database update
  } catch (error) {
    // Clean up newly uploaded if database update fails

    if (uploadedImage) {
      try {
        await cloudinary.uploader.destroy(uploadedImage.public_id);
      } catch (cleanupError) {
        console.error("New image cleanup failed:", cleanupError.message);
      }
    }
    throw error;
  }

  // Database save was succeeded. Now clean up old image
  if (uploadedImage && oldImagePublicId) {
    try {
      await cloudinary.uploader.destroy(oldImagePublicId);
    } catch (cleanupError) {
      console.error("Old image cleanup failed: ", cleanupError.message);
    }
  }

  res.status(200).json({
    status: "success",
    data: { product },
  });
});

exports.deleteProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) return next(new AppError("Product not found", 404));

  if (product.isDeleted) {
    return next(new AppError("The product is already deleted", 400));
  }

  product.isDeleted = true;
  product.deletedAt = new Date();

  await product.save();

  // Delete product image from cloudinary

  if (product.imagePublicId) {
    try {
      await cloudinary.uploader.destroy(product.imagePublicId);
    } catch (error) {
      console.error("Cloudinary image cleanup failed: ");
    }
  }

  res.status(200).json({
    status: "success",
    message: "Product deleted successfully",
  });
});
