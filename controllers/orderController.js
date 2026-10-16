const Order = require("../models/orderModel");
const Cart = require("../models/cartModel");
const Product = require("../models/productModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const mongoose = require("mongoose");

exports.createOrder = catchAsync(async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    let createdOrder;
    await session.withTransaction(async () => {
      const cart = await Cart.findOne({ user: req.user._id })
        .populate("items.product")
        .session(session);

      if (!cart || cart.items.length === 0) {
        throw new AppError("Cart is empty", 400);
      }

      const totalAmount = cart.items.reduce((sum, item) => {
        return sum + item.product.price * item.quantity;
      }, 0);

      for (const item of cart.items) {
        // validate all cart items before changing the stock

        if (!Number.isInteger(item.quantity) || item.quantity < 1) {
          throw new AppError("Invalid quantity in cart", 400);
        }

        if (item.quantity > item.product.countInStock) {
          throw new AppError(
            `Insufficient stock of ${item.product.name}. Only ${item.product.countInStock} items available.`,
            400,
          );
        }
        const updatedProduct = await Product.findOneAndUpdate(
          { _id: item.product._id, countInStock: { $gte: item.quantity } },
          { $inc: { countInStock: -item.quantity } },
          { new: true, session },
        );

        if (!updatedProduct) {
          throw new AppError(
            `Stock changed for ${item.product.name}. Please try again`,
            400,
          );
        }
      }
      // create orders after all stock checks and deductions
      const orders = await Order.create(
        [
          {
            user: req.user._id,
            items: cart.items.map((item) => ({
              product: item.product._id,
              quantity: item.quantity,
            })),
            totalAmount,
          },
        ],
        { session },
      );

      createdOrder = orders[0];

      // clear cart
      cart.items = [];
      await cart.save({ session });
    });

    res.status(201).json({
      status: "success",
      data: { order: createdOrder },
    });
  } finally {
    await session.endSession();
  }
});

exports.cancelOrder = catchAsync(async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    let cancelledOrder;
    await session.withTransaction(async () => {
      const order = await Order.findOne({
        _id: req.params.orderId,
        user: req.user._id,
      })
        .populate("items.product")
        .session(session);

      if (!order) {
        throw new AppError("Order not found", 404);
      }

      if (order.orderStatus === "cancelled") {
        throw new AppError("This order has already been cancelled", 400);
      }

      if (["shipped", "delivered"].includes(order.orderStatus)) {
        throw new AppError("This order can not be cancelled.", 400);
      }

      for (const item of order.items) {
        const updatedProduct = await Product.findOneAndUpdate(
          item.product._id,
          {
            $inc: { countInStock: item.quantity },
          },
          { new: true, session },
        );

        if (!updatedProduct) {
          throw new AppError(
            `Could not restore stock for ${item.product.name}.`,
            400,
          );
        }
      }

      order.orderStatus = "cancelled";
      cancelledOrder = await order.save({ session });
    });
    res.status(200).json({
      status: "success",
      data: { cancelledOrder },
    });
  } finally {
    await session.endSession();
  }
});

exports.getMyOrders = catchAsync(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).populate(
    "user items.product",
  );
  res.status(200).json({
    status: "success",
    data: { orders },
  });
});

exports.getAllOrders = catchAsync(async (req, res, next) => {
  const orders = await Order.find().populate("user items.product");

  res.status(200).json({
    status: "success",
    data: { orders },
  });
});

exports.updateOrderStatus = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.orderId);
  if (!order) return next(new AppError("Order not found", 404));

  order.orderStatus = req.body.status;
  await order.save();

  res.status(200).json({
    status: "success",
    data: { order },
  });
});
