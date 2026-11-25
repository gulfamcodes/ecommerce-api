const express = require("express");
const { signup, login } = require("../controllers/authController");

const { loginLimiter, signupLimiter } = require("../middlewares/rateLimiter");

const router = express.Router();

router.post("/signup", signupLimiter, signup);
router.post("/login", loginLimiter, login);

module.exports = router;
