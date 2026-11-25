const express = require("express");
const {
  addReview,
  updateReview,
  deleteReview,
  getReviewsForProduct,
} = require("../controllers/reviewController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.route("/product/:productId").get(getReviewsForProduct);

router.use(protect);

router.route("/").post(addReview);

router.route("/:reviewId").patch(updateReview).delete(deleteReview);

module.exports = router;
