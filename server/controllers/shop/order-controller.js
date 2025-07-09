// controllers/shop/order-controller.js
const { v4: uuid } = require("uuid");
const axios = require("axios");
const esewa = require("../../helpers/esewa");
const Order = require("../../models/Order");
const Cart = require("../../models/Cart");
const Product = require("../../models/Product");

/* --------------- CREATE ORDER & RETURN eSewa FORM DATA -------------- */
exports.createOrder = async (req, res) => {
  try {
    const {
      userId,
      cartItems,
      addressInfo,
      totalAmount,
      orderStatus = "pending",
      paymentMethod = "esewa",
      paymentStatus = "unpaid",
      cartId,
    } = req.body;

    /* 1️⃣  Build the unique transaction id (pid) */
    const transaction_uuid = uuid(); // e.g. "c93f37c6‑fb37‑4d7d‑ab68‑a2b59ac4b501"

    /* 2️⃣  Persist the order in DB (PENDING) */
    const order = await Order.create({
      userId,
      cartId,
      cartItems,
      addressInfo,
      orderStatus,
      paymentMethod,
      paymentStatus,
      totalAmount,
      transaction_uuid, // ★ store this for later verification
    });

    /* 3️⃣  Generate the request signature */
    const total_amount = +totalAmount.toFixed(2);
    const signature = esewa.sign({ total_amount, transaction_uuid });

    /* 4️⃣  Build form‑data for the front‑end */
    const formData = {
      amount: total_amount, // base price (no breakdown)
      tax_amount: 0,
      total_amount,
      transaction_uuid,
      product_code: esewa.productCode,
      product_service_charge: 0,
      product_delivery_charge: 0,
      success_url: `${process.env.CLIENT_APP_URL}/shop/esewa-success?orderId=${order._id}`,
      failure_url: `${process.env.CLIENT_APP_URL}/shop/esewa-failure?orderId=${order._id}`,
      signed_field_names: "total_amount,transaction_uuid,product_code",
      signature,
    };

    /* 5️⃣  Send the form spec back so UI can POST to eSewa */
    res.status(201).json({
      success: true,
      formUrl: esewa.formEndpoint,
      formData,
      orderId: order._id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* -------------------- VERIFY (capture) PAYMENT ---------------------- *
 * Called from your `success_url` page after redirect.
 * The front‑end should forward: { orderId, total_amount, transaction_uuid }
 */
exports.verifyPayment = async (req, res) => {
  try {
    const { orderId, total_amount, transaction_uuid } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    /* 1️⃣  Ask eSewa for the transaction status */
    const { data: status } = await axios.get(esewa.statusEndpoint, {
      params: {
        product_code: esewa.productCode,
        total_amount,
        transaction_uuid,
      },
    });

    if (status.status !== "COMPLETE") {
      return res.status(400).json({
        success: false,
        message: `Payment ${status.status}`,
        esewaStatus: status,
      });
    }

    /* 2️⃣  Update order → PAID */
    order.paymentStatus = "paid";
    order.orderStatus = "confirmed";
    order.paymentId = status.ref_id; // save reference id
    await Promise.all(
      order.cartItems.map(async (item) => {
        const product = await Product.findById(item.productId);
        if (product) {
          product.totalStock -= item.quantity;
          await product.save();
        }
      })
    );

    await Cart.findByIdAndDelete(order.cartId);
    await order.save();

    res.status(200).json({
      success: true,
      message: "Order confirmed",
      data: order,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Verification failed" });
  }
};

/* ---------------------------- QUERIES ------------------------------- */
exports.getAllOrdersByUser = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.params.userId });
    if (!orders.length) {
      return res
        .status(404)
        .json({ success: false, message: "No orders found" });
    }
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getOrderDetails = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
