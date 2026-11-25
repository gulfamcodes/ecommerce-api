const mongoose = require("mongoose");
const Review = require("../models/reviewModel");
const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

const updateProductRating = async (productId) => {
  const productObjectId = mongoose.Types.ObjectId.createFromHexString(
    productId.toString(),
  );
  const ratingStats = await Review.aggregate([
    {
      $match: {
        product: productObjectId,
      },
    },
    {
      $group: {
        _id: "$product",
        averageRating: { $avg: "$rating" },
        numberOfRatings: { $sum: 1 },
      },
    },
  ]);

  if (ratingStats.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      ratingsAverage: ratingStats[0].averageRating,
      ratingsQuantity: ratingStats[0].numberOfRatings,
    });
  } else {
    await Product.findByIdAndUpdate(productId, {
      ratingsAverage: 0,
      ratingsQuantity: 0,
    });
  }
};

exports.addReview = catchAsync(async (req, res, next) => {
  const { product, rating, comment } = req.body;

  if (!mongoose.isValidObjectId(product)) {
    return next(new AppError("Invalid product ID", 400));
  }

  const productExists = await Product.findOne({
    _id: product,
    isDeleted: { $ne: true },
  });

  if (!productExists) {
    return next(new AppError("Product not found", 404));
  }

  const deliveredOrder = await Order.findOne({
    user: req.user._id,
    "items.product": product,
    orderStatus: "delivered",
  });

  if (!deliveredOrder) {
    const purchasedOrder = await Order.findOne({
      user: req.user._id,
      "items.product": product,
    });

    if (!purchasedOrder) {
      return next(
        new AppError(
          "You can only review products that you have purchased.",
          400,
        ),
      );
    }

    return next(
      new AppError(
        "You can only review a product after the order has been delivered.",
        400,
      ),
    );
  }

  const existingReview = await Review.findOne({
    user: req.user._id,
    product,
  });

  if (existingReview) {
    return next(new AppError("You have already reviewed this product.", 400));
  }

  const review = await Review.create({
    user: req.user._id,
    product,
    rating,
    comment,
  });

  await updateProductRating(product);

  res.status(201).json({
    status: "success",
    data: { review },
  });
});

exports.updateReview = catchAsync(async (req, res, next) => {
  const review = await Review.findOne({
    _id: req.params.reviewId,
    user: req.user._id,
  });

  if (!review) return next(new AppError("Review not found or not yours", 404));

  const { rating, comment } = req.body;

  if (rating === undefined && comment === undefined) {
    return next(new AppError("No valid review updates provided", 400));
  }

  if (rating !== undefined) {
    review.rating = rating;
  }

  if (comment !== undefined) {
    review.comment = comment;
  }

  await review.save();

  await updateProductRating(review.product);

  res.status(200).json({
    status: "success",
    data: { review },
  });
});

exports.deleteReview = catchAsync(async (req, res, next) => {
  const review = await Review.findOneAndDelete({
    _id: req.params.reviewId,
    user: req.user._id,
  });

  if (!review) return next(new AppError("Review not found or not yours", 404));

  await updateProductRating(review.product);

  res.status(200).json({
    status: "success",
    data: null,
  });
});

exports.getReviewsForProduct = catchAsync(async (req, res, next) => {
  const { productId } = req.params;
  if (!mongoose.isValidObjectId(productId)) {
    return next(new AppError("Invalid product ID", 400));
  }

  const productExists = await Product.findOne({
    _id: productId,
    isDeleted: { $ne: true },
  });

  if (!productExists) {
    return next(new AppError("Product not found", 404));
  }

  //pagination
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 10);

  if (
    !Number.isInteger(page) ||
    page < 1 ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 100
  ) {
    return next(new AppError("Invalid pagination parameters", 400));
  }

  const skip = (page - 1) * limit;

  const totalReviews = await Review.countDocuments({
    product: productId,
  });

  const totalPages = Math.ceil(totalReviews / limit);

  const reviews = await Review.find({ product: productId })
    .populate("user", "name")
    .sort("-createdAt")
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    status: "success",
    results: reviews.length,
    pagination: {
      page,
      limit,
      totalReviews,
      totalPages,
    },
    data: { reviews },
  });
});
