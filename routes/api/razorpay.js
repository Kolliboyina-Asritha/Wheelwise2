require('dotenv').config();
const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const router = express.Router();
const Products = require('../../model/products');
const Cart = require('../../model/cart');
const verifyJWT=require('../../middleware/verifyJWT');

const Order = require('../../model/order');
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});



router.post('/create-order', verifyJWT, async (req, res) => {

  try {

    const { cartItems, buyer, paymentMethod } = req.body;

    // ================= VALIDATION =================
    if (!cartItems?.length || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // ================= TRUST USER =================
    const userEmail = req.user;

    // ================= BUILD ORDER ITEMS =================
    let totalAmount = 0;

    const orderItems = [];

    for (const item of cartItems) {

      const product = await Products.findById(item.productId);

      if (!product) continue;

      const qty = Number(item.quantity);

      if (qty <= 0) continue;

      const subtotal = product.price * qty;

      totalAmount += subtotal;

      orderItems.push({
        productId: product._id,
        title: product.title,
        imageUrl: product.imageUrl,
        price: product.price,
        quantity: qty
      });
    }

    // ================= NO VALID PRODUCTS =================
    if (!orderItems.length) {
      return res.status(400).json({
        success: false,
        message: 'No valid products found'
      });
    }

    // ================= INVALID TOTAL =================
    if (!totalAmount || isNaN(totalAmount)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid price calculation'
      });
    }

    // ================= COD FLOW =================
    if (paymentMethod === 'COD') {

      const order = await Order.create({
        userEmail,
        buyer,
        items: orderItems,
        totalAmount: totalAmount,
        paymentMethod: 'COD',
        paymentStatus: 'pending',
        status: 'placed'
      });

      // remove ordered items from cart
      await Cart.deleteMany({
        userEmail,
        vehicleId: {
          $in: orderItems.map(i => i.productId)
        }
      });

      return res.status(201).json({
        success: true,
        cod: true,
        order
      });
    }

    // ================= RAZORPAY FLOW =================
    const razorpayOrder = await razorpay.orders.create({
      amount: totalAmount * 100,
      currency: 'INR',
      receipt: `rcpt_${Date.now().toString().slice(-8)}`
    });

    const order = await Order.create({
      userEmail,
      buyer,
      items: orderItems,
      totalAmount: totalAmount,
      paymentMethod: 'RAZORPAY',
      paymentStatus: 'pending',
      status: 'placed',
      razorpayOrderId: razorpayOrder.id
    });

    return res.status(201).json({
      success: true,
      order,
      razorpayOrder
    });

  } catch (error) {

    console.error('Create Order Error FULL:', error);

    return res.status(500).json({
      success: false,
      message:
        error?.error?.description ||
        error.message ||
        'Order creation failed'
    });
  }
});
router.post('/verify-signature', verifyJWT, async (req, res) => {

  try {

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    // ================= VALIDATION =================
    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message: 'Missing payment details'
      });
    }

    // ================= SIGNATURE CHECK =================
    const body =
      razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid signature'
      });
    }

    // ================= ONLY CHECK ORDER =================
    const order = await Order.findOne({
      razorpayOrderId: razorpay_order_id
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    return res.json({
      success: true,
      message: order.paymentStatus === 'paid'
        ? 'Payment confirmed'
        : 'Payment initiated, waiting webhook confirmation'
    });

  } catch (err) {

    console.error('Verification Error:', err);

    return res.status(500).json({
      success: false,
      message: 'Payment verification failed'
    });
  }
});
router.post('/webhook', async (req, res) => {


  try {

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const razorpaySignature = req.headers['x-razorpay-signature'];

    // ================= RAW BODY =================
    const body = req.body.toString();

    // ================= VERIFY SIGNATURE =================
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      console.log('❌ Invalid webhook signature');
      return res.status(400).json({ success: false });
    }

    const data = JSON.parse(body);

    console.log('✅ Webhook verified');

    const event = data.event;
    console.log("🔥 EVENT RECEIVED:", event);

    // ================= PAYMENT SUCCESS =================
    if (event === 'payment.captured' ||
  event === 'payment.authorized' ||
  event === 'order.paid') {

      const payment = data.payload.payment.entity;

      const razorpayOrderId = payment.order_id;
      const razorpayPaymentId = payment.id;

      const updatedOrder = await Order.findOneAndUpdate(
        {
          razorpayOrderId,
          paymentStatus: { $ne: 'paid' }
        },
        {
          paymentStatus: 'paid',
          status: 'placed',
          razorpayPaymentId
        },
        { new: true }
      );

      // ================= IDEMPOTENT CHECK =================
      if (!updatedOrder) {
        console.log('⚠️ Already processed or not found');
        return res.json({ success: true });
      }
       console.log("USER EMAIL:", updatedOrder.userEmail);

console.log(
  "PRODUCT IDS:",
  updatedOrder.items.map(i => i.productId)
);
      // ================= CART CLEANUP =================
      await Cart.deleteMany({
        userEmail: updatedOrder.userEmail,
        vehicleId: {
          $in: updatedOrder.items.map(i => i.productId)
        }
      });

      console.log('🛒 Cart cleaned after payment');
    }

    // ================= PAYMENT FAILED =================
    if (event === 'payment.failed') {
      console.log('❌ Payment failed');
    }

    return res.json({ success: true });

  } catch (err) {

    console.error('❌ Webhook Error:', err);

    return res.status(500).json({ success: false });
  }
});
module.exports = router;