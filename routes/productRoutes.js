const express = require("express");
const validateImage = require("../middlewares/validateImage");
const upload = require("../middlewares/uploadMiddleware");
const {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getProduct,
} = require("../controllers/productController");
const { protect, restrictTo } = require("../middlewares/authMiddleware");

const router = express.Router();

router
  .route("/")
  .get(getAllProducts)
  .post(
    protect,
    restrictTo("admin"),
    upload.single("image"),
    validateImage,
    createProduct,
  );

router
  .route("/:id")
  .get(getProduct)
  .patch(
    protect,
    restrictTo("admin"),
    upload.single("image"),
    validateImage,
    updateProduct,
  )
  .delete(protect, restrictTo("admin"), deleteProduct);

module.exports = router;
