const Order = require('../models/orderModel');
const Cart = require('../models/cartModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.createOrder = catchAsync(async (req, res, next) => {
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart || cart.items.length === 0)
        return next(new AppError('Cart is empty', 400));
    const totalAmount = cart.items.reduce((sum, item) => {
        return sum + item.product.price * item.quantity;
    }, 0);

    const order = await Order.create({
        user: req.user._id,
        items: cart.items.map((item => ({
            product: item.product._id,
            quantity: item.quantity
        }))),
        totalAmount
    });
    await Cart.findByIdAndUpdate(cart._id, {items:[]});

    res.status(201).json({
        status: 'success',
        data: { order }
    });
});

exports.getMyOrders = catchAsync(async (req, res) => {
    const orders = await Order.find({user:req.user._id}).populate('user items.product');
    res.status(200).json({
        status: 'success',
        data: { orders }
    });
});

exports.getAllOrders = catchAsync(async (req, res, next) => {
    const orders = await Order.find().populate('user items.product');

    res.status(200).json({
        status: 'success',
        data: { orders }
    });
});

exports.updateOrderStatus = catchAsync(async (req, res) => {
    const order = await Order.findById(req.params.orderId);
    if (!order) return next(new AppError('Order not found', 404));

    order.orderStatus = req.body.status;
    await order.save();

    res.status(200).json({
        status: 'success',
        data: { order }
    });
});

