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

exports.createProduct = catchAsync(async (req, res, next) => {
  const product = await Product.create(req.body);
  res.status(200).json({
    status: "success",
    data: { product },
  });
});

exports.updateProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!product) return next(new AppError("Product not found", 404));
  res.status(200).json({
    status: "success",
    data: { product },
  });
});

exports.deleteProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return next(new AppError("Product not found", 404));
  res.status(200).json({
    status: "success",
    data: null,
  });
});
