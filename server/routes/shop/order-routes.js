const express = require("express");
const router  = express.Router();
const {
  createOrder,
  verifyPayment,
  getAllOrdersByUser,
  getOrderDetails,
} = require("../../controllers/shop/order-controller");

// eSewa
router.post("/esewa/create-order",  createOrder);
router.post("/esewa/verify-payment", verifyPayment); // called by your success page

// queries
router.get("/user/:userId/orders", getAllOrdersByUser);
router.get("/:id",                 getOrderDetails);

module.exports = router;
