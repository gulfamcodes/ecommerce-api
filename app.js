const express = require ('express');
const morgan = require ('morgan');
const AppError = require ('./utils/appError');
const globalErrorHandler = require ('./middlewares/errorHandler');

// Route files
const authRoutes = require('./routes/authRoutes');
const productRoutes = require ('./routes/productRoutes');
const cartRoutes = require ('./routes/cartRoutes');
const orderRoutes = require ('./routes/orderRoutes');
const reviewRoutes = require ('./routes/reviewRoutes');

const app = express();

//Middlewares
app.use(morgan('dev'));
app.use(express.json());

//Routes
// console.log('Registering routes...');
// app.use('/api/v1/users', authRoutes);
// app.use('/api/v1/products',productRoutes);
// app.use('/api/v1/cart', cartRoutes);
// app.use('/api/v1/orders', orderRoutes);
// app.use('/api/v1/reviews', reviewRoutes);
// console.log('Routes registered successfully');

//404 handler
app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl}`,404));
});

//Global error handler
app.use(globalErrorHandler);

module.exports = app;