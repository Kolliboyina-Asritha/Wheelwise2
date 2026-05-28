const express = require('express');
const router = express.Router();
const {getUserOrders,deleteorders } = require('../../logcontroller/orderController');
const verifyJWT = require('../../middleware/verifyJWT');
const Order = require('../../model/order');
const Products=require('../../model/products');
const verifyRoles = require('../../middleware/verifyroles');
const ROLES_LIST = require('../../config/role_list');

const Razorpay = require('razorpay');

const razorpay = new Razorpay({

  key_id: process.env.RAZORPAY_KEY_ID,

  key_secret: process.env.RAZORPAY_KEY_SECRET

});


router.get('/my-orders', verifyJWT, getUserOrders);
router.put(
  '/:id/status',
  verifyJWT,
  verifyRoles(ROLES_LIST.Seller),
  async (req, res) => {

    const { status } = req.body;
    const { id } = req.params;

    try {

      // 1. VALID STATUSES
      const allowedStatus = ['placed', 'shipped', 'delivered', 'cancelled'];

      if (!allowedStatus.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status'
        });
      }

      // 2. FIND ORDER
      const order = await Order.findById(id);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // 3. GET SELLER PRODUCTS
      const sellerProducts = await Products.find({
        seller: req.id
      }).select('_id');

      const productIds = sellerProducts.map(p => p._id.toString());

      // 4. OWNERSHIP CHECK
      const isOwner = order.items.some(item =>
        productIds.includes(item.productId.toString())
      );

      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this order'
        });
      }

      // 5. VALID STATUS FLOW (IMPORTANT)
      const current = order.status;

      const validFlow = {
        placed: ['shipped', 'cancelled'],
        shipped: ['delivered', 'cancelled'],
        delivered: [],
        cancelled: []
      };

     if (!validFlow[current]) {
  return res.status(400).json({
    success: false,
    message: `Invalid current status: ${current}`
  });
}

if (!validFlow[current].includes(status)) {
  return res.status(400).json({
    success: false,
    message: `Cannot change ${current} → ${status}`
  });
}

      // 6. UPDATE ORDER
      order.status = status;

      if(status === 'cancelled'){

        order.cancelledBy = 'seller';

        order.cancelReason =
          req.body.reason || 'Cancelled by seller';
         if (
    order.paymentMethod === 'RAZORPAY' &&
    order.paymentStatus === 'paid' &&
    order.razorpayPaymentId
  ) {
    try {
      const refund = await razorpay.payments.refund(
        order.razorpayPaymentId,
        {
          amount: Math.round(order.totalAmount * 100)
        }
      );

      console.log('✅ Seller Refund Success:', refund.id);

      order.refundStatus = 'processed';
      order.refundId = refund.id;

    } catch (err) {
      console.error('❌ Seller Refund Failed:', err);
      order.refundStatus = 'pending';
    }
  }
      }

      if (status === 'delivered') {
        order.deliveredAt = new Date();
      }

      await order.save();

      return res.json({
        success: true,
        message: 'Order status updated',
        order
      });

    } catch (err) {

      console.error('Failed to update order status:', err);

      return res.status(500).json({
        success: false,
        message: 'Error updating order'
      });
    }
  }
);
  

router.put(
  '/cancel/:id',
  verifyJWT,
  async (req, res) => {

    try {

      const { id } = req.params;

      const { reason } = req.body;

      const userEmail = req.user;

      // ================= FIND USER ORDER =================

      const order = await Order.findOne({
        _id: id,
        userEmail
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // ================= BLOCK INVALID STATUS =================

      if (
        order.status === 'shipped' ||
        order.status === 'delivered'
      ) {
        return res.status(400).json({
          success: false,
          message: 'Cannot cancel order now'
        });
      }

      if (order.status === 'cancelled') {
        return res.status(400).json({
          success: false,
          message: 'Order already cancelled'
        });
      }

      // ================= UPDATE ORDER =================

      order.status = 'cancelled';

      order.cancelReason =
        reason || 'No reason provided';

      order.cancelledBy = 'buyer';

      // ================= AUTO REFUND =================

      if (
        order.paymentMethod === 'RAZORPAY' &&
        order.paymentStatus === 'paid' &&
        order.razorpayPaymentId
      ) {

        try {

          const refund =
            await razorpay.payments.refund(
              order.razorpayPaymentId,
              {
                amount:
                  Math.round(order.totalAmount * 100)
              }
            );

          console.log(
            '✅ Refund Success:',
            refund.id
          );

          order.refundStatus = 'processed';

          order.refundId = refund.id;

        } catch (refundErr) {

          console.error(
            '❌ Refund Failed:',
            refundErr
          );

          order.refundStatus = 'pending';
        }
      }

      // ================= SAVE =================

      await order.save();

      return res.json({
        success: true,
        message: 'Order cancelled successfully',
        order
      });

    } catch (err) {

      console.error(err);

      return res.status(500).json({
        success: false,
        message: 'Cancellation failed'
      });
    }
});
// REMOVE ORDER

router.put(
  '/:id/hide',
  verifyJWT,
  
  deleteorders
);

module.exports = router;
