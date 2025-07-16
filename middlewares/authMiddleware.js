const jwt = require ('jsonwebtoken');
const User = require ('../models/userModel');
const catchAsync = require ('../utils/catchAsync');
const AppError = require ('../utils/appError');

exports.protect = catchAsync ( async (req ,res , next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if(!token) return next(new AppError('You are not logged in!', 401));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if(!user) return next(new AppError('User not found', 401));

    req.user = user;
    next();
});

exports.restrictTo = (...roles) => {
    return ( req ,res ,next) => {
        if(!roles.includes(req.user.role))
            return next(new AppError('You do not have permission to perform this action',403));
        next();
    };
};