const Cart = require("../models/cartModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Product = require("../models/productModel");
exports.getCart = catchAsync(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate(
    "items.product",
  );
  res.status(200).json({
    status: "success",
    data: { cart },
  });
});

exports.addToCart = catchAsync(async (req, res, next) => {
  const { product, quantity } = req.body;

  // validate input
  if (!Number.isInteger(quantity) || quantity < 1) {
    return next(new AppError("Quantity must be a positive integer", 400));
  }

  // check whether product exists
  const productExists = await Product.findById(product);
  if (!productExists) {
    return next(
      new AppError("Product not found, Cannot add to the cart!", 404),
    );
  }

  // check available stock
  if (quantity > productExists.countInStock) {
    return next(
      new AppError(
        `Only ${productExists.countInStock} items available in stock`,
        400,
      ),
    );
  }
  let cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    cart = await Cart.create({
      user: req.user._id,
      items: [{ product, quantity }],
    });
  } else {
    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === product,
    );

    if (itemIndex > -1) {
      const newQuantity = cart.items[itemIndex].quantity + quantity;

      // validate combined quantity
      if (newQuantity > productExists.countInStock) {
        return next(
          new AppError(
            `Only ${productExists.countInStock} items are available in stock.`,
            400,
          ),
        );
      }
      cart.items[itemIndex].quantity = newQuantity;
    } else {
      cart.items.push({ product, quantity });
    }
    await cart.save();
  }

  res.status(200).json({
    status: "success",
    data: { cart },
  });
});

exports.updateCartItem = catchAsync(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user._id });

  const { quantity } = req.body;
  // validate quantity
  if (!Number.isInteger(quantity) || quantity < 1) {
    return next(new AppError("Quantity must be a positive integer", 400));
  }
  if (!cart) return next(new AppError("Cart not found", 404));

  const item = cart.items.find(
    (item) => item.product.toString() === req.params.productId,
  );
  if (!item) return next(new AppError("Item not found", 404));

  const product = Product.findOne(item.product);

  if (!product) {
    return next(new AppError("Product not found", 404));
  }

  if (quantity > product.countInStock) {
    return next(
      new AppError(`Only ${product.countInStock} left in stock.`, 400),
    );
  }

  item.quantity = req.body.quantity;
  await cart.save();

  res.status(200).json({
    status: "success",
    data: { cart },
  });
});

exports.removeFromCart = catchAsync(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) return next(new AppError("Cart not found", 404));

  const itemExists = cart.items.some(
    (item) => item.product.toString() === req.params.productId,
  );

  if (!itemExists) {
    return next(new AppError("Item not found in the cart.", 404));
  }

  cart.items = cart.items.filter(
    (item) => item.product.toString() !== req.params.productId,
  );
  await cart.save();

  res.status(200).json({
    status: "success",
    data: { cart },
  });
});
