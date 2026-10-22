const express = require("express");
const {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
  updatePaymentStatus,
} = require("../controllers/orderController");
const { protect, restrictTo } = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(protect);

router.route("/").post(createOrder).get(getMyOrders);
router.route("/all").get(restrictTo("admin"), getAllOrders);

router
  .route("/:orderId/payment")
  .patch(restrictTo("admin"), updatePaymentStatus);
router.route("/:orderId/cancel").patch(cancelOrder);
router.route("/:orderId").patch(restrictTo("admin"), updateOrderStatus);

module.exports = router;
