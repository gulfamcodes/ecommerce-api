const express = require('express');
const {
    getAllProducts,
    createProduct,
    updateProduct,
    deleteProduct
} = require('../controllers/productController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

const router = express.Router();

router.route('/')
    .get(getAllProducts)
    .post(protect, restrictTo('admin'), createProduct);

router.route('/:id')
    .patch(protect, restrictTo('admin'), updateProduct)
    .delete(protect, restrictTo('admin'), deleteProduct);

module.exports = router;