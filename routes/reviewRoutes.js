const express = require('express');
const {
    addReview,
    updateReview,
    deleteReview,
    getReviewsForProduct
} = require('../controllers/reviewController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect);

router.route('/')
    .post(addReview);

router.route('/:reviewId')
    .patch(updateReview)
    .delete(deleteReview);

router.route('/product/:productId')
    .get(getReviewsForProduct);

module.exports = router;