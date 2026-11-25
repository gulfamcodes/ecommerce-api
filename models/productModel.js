const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product must have a name"],
      trim: true,
      maxlength: [200, "Product name cannot exceed 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Product description cannot exceed 2000 characters"],
    },
    price: {
      type: Number,
      required: [true, "Product must have a price"],
      min: [0, "Price cannot be negative"],
    },
    category: {
      type: String,
      required: [true, "Product must have a category"],
      trim: true,
      maxlength: [100, "Category cannot exceed 100 characters"],
    },
    image: {
      type: String,
      default: "default.jpg",
    },
    imagePublicId: {
      type: String,
      default: null,
    },
    countInStock: {
      type: Number,
      default: 0,
      min: [0, "Stock cannot be negative"],
      validate: {
        validator: Number.isInteger,
        message: "Stock must be an integer",
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [0, "Rating cannot be below 0"],
      max: [5, "Rating cannot exceed 5"],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
      min: [0, "Ratings quantity cannot be negative"],
      validate: {
        validator: Number.isInteger,
        message: "Ratings quantity must be an integer",
      },
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Product", productSchema);
