const express = require('express');
const {
    getCart,
    addToCart,
    removeFromCart,
    updateCartItem
} = require('../controllers/cartController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect);

router.route('/')
    .get(getCart)
    .post(addToCart);

router.route('/:productId')
    .patch(updateCartItem)
    .delete(removeFromCart);

module.exports = router;