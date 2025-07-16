const jwt = require ('jsonwebtoken');
const User = require ('../models/userModel');
const catchAsync = require ('../utils/catchAsync');
const AppError = require ('../utils/appError');

const signToken = id => jwt.sign({ id }, process.env.JWT_SECRET , {
    expiresIn: process.env.JWT_EXPIRES_IN
});

exports.signup = catchAsync ( async ( req ,res ,next) => {
    const newUser = await User.create(req.body);
    const token = signToken(newUser._id);

    res.status(201).json({
        status: 'success',
        token,
        data: { user : newUser}
    });
});

exports.login = catchAsync ( async (req ,res , next) => {
    const { email , password} = req.body;
    if (!email || ! password) 
        return next(new AppError('Please provide email and password', 404));

    const user = await User.findOne({ email }).select('+password');
    if(!user || !(await user.correctPassword(password, user.password))){
    return next(new AppError('Incorrect email or password', 401))};

    const token = signToken( user._id);
    res.status(200).json({
        status : 'success',
        token
    });
});

exports.protect = catchAsync ( async ( req ,res , next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if(!token) return next (new AppError('You are not logged in!', 401));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const currentUser = await User.findById(decoded.id);
    if(!currentUser) return next(new AppError('User no lenger exists', 401));

    req.user = currentUser;
    next();
});

exports.restrictTo = (...roles) => {
    return (req ,res , next) => {
        if(!roles.includes(req.user.role))
            return next(new AppError('You are not authorized', 403));
        next();
    };
};