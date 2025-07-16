const Cart = require('../models/cartModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getCart = catchAsync(async (req, res, next) => {
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    res.status(200).json({
        status: 'success',
        data: { cart }
    });
});

exports.addToCart = catchAsync(async (req, res) => {
    const { product, quantity } = req.body;

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
        cart = await Cart.create({
            user: req.user._id,
            items: [{ product, quantity }]
        });
    } else {
        const itemIndex = cart.items.findIndex(item => item.product.toString() === product);


        if (itemIndex > -1) {
            cart.items[itemIndex].quantity+=quantity;
        } else {
            cart.items.push({ product, quantity });
        }
        await cart.save();
    }

    res.status(200).json({
        status: 'success',
        data: { cart }
    });
});

exports.updateCartItem = catchAsync ( async ( req ,res , next) => {
    const cart = await Cart.findOne({ user: req.user._id});
    if(!cart) return next(new AppError('Cart not found', 404));

    const item = cart.items.find(item => item.product.toString() === req.params.productId);
    if(!item) return next (new AppError('Item not found', 404));

    item.quantity = req.body.quantity;
    await cart.save();

    res.status(200).json({
        status: 'success',
        data: {cart}
    });
});

exports.removeFromCart = catchAsync ( async (req , res, next) => {
    const cart = await Cart.findOne({user: req.user._id});
    if(!cart) return next(new AppError('Cart not found', 404));

    cart.items = cart.items.filter(item => item.product.toString() !== req.params.productId);
    await cart.save();

    res.status(200).json({
        status : 'success',
        data : {cart}
    });
});