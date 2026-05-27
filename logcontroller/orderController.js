const Order = require('../model/order');
const Products = require('../model/products');


const getUserOrders = async (req, res) => {

  try {

  const userEmail = req.user;

const orders = await Order.find({
  userEmail,
  isDeleted: false,
  $or: [
    { paymentMethod: 'COD' },
    { paymentStatus: 'paid' }
  ]
}).sort({ createdAt: -1 });

    return res.json(orders);

  } catch (err) {

    console.error('Failed to fetch user orders:', err);

    return res.status(500).json({
      message: 'Failed to fetch orders'
    });
  }
};
const deleteorders = async (req, res) => {

  try {

    const orderId = req.params.id;
    const userEmail = req.user;

    // ================= FIND ORDER SAFELY =================
    const order = await Order.findOne({
      _id: orderId,
      userEmail: userEmail
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // ================= SOFT DELETE =================
    order.isDeleted = true;
    await order.save();

    return res.status(200).json({
      success: true,
      message: 'Order removed successfully'
    });

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      success: false,
      message: 'Failed to remove order'
    });
  }
};

// ✅ Export both
module.exports = {

  
  getUserOrders,
  deleteorders
};

