const Review = require("../models/reviewModel");
const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

const updateProductRating = async (productId) => {
  const ratingStats = await Review.aggregate([
    { $match: { product: productId } },
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

  const order = await Order.findOne({
    user: req.user._id,
    "items.product": product,
  });

  if (!order) {
    return next(
      new AppError(
        "You can only review products that you have purchased.",
        400,
      ),
    );
  }

  if (order.orderStatus !== "delivered") {
    return next(
      new AppError(
        "You can only review a product after the order has been delivered.!",
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
  const review = await Review.findOneAndUpdate(
    { _id: req.params.reviewId, user: req.user._id },
    req.body,
    { new: true, runValidators: true },
  );

  if (!review) return next(new AppError("Review not found or not yours", 404));

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

exports.getReviewsForProduct = catchAsync(async (req, res) => {
  const reviews = await Review.find({ product: req.params.productId });
  res.status(200).json({
    status: "success",
    data: { reviews },
  });
});
