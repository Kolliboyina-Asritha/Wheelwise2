const express = require('express');
const router = express.Router();
const verifyJWT = require('../../middleware/verifyJWT');
const verifyRoles = require('../../middleware/verifyroles');
const ROLES_LIST = require('../../config/role_list');

const Userd = require('../../model/userd');
const Products = require('../../model/products');
const Orders = require('../../model/order');

router.get('/seller', verifyJWT, verifyRoles(ROLES_LIST.Seller), async (req, res) => {
  try {
    console.log("Seller email from token:", req.user);
    console.log("Seller ID from token:", req.id);

    const sellerId = req.id;
    if (!sellerId) return res.status(400).json({ message: 'Invalid seller ID' });

    // Step 1: Get products belonging to this seller
    const sellerProducts = await Products.find({ seller: sellerId }).select('_id');
    const productIds = sellerProducts.map(p => p._id);
    console.log("Product IDs of seller:", productIds);

    if (!productIds.length) return res.status(200).json([]);

    // Step 2: Find orders that include any of these product IDs
    const orders = await Orders.find({ 'items.productId': { $in: productIds },  status: { $ne: 'expired' }})
      .populate('items.productId')
      .sort({ createdAt: -1 });

    console.log(`Found ${orders.length} orders for seller's vehicles`);
    const filteredOrders = orders.map(order => {

  const sellerItems = order.items.filter(item => {

    return item.productId &&
      productIds.some(
        id => id.toString() === item.productId._id.toString()
      );
  });

  return {
    ...order.toObject(),
    items: sellerItems
  };
});

res.json(filteredOrders);
    
  } catch (err) {
    console.error('Failed to fetch seller orders:', err);
    res.status(500).json({ message: 'Server error fetching orders' });
  }
});

module.exports = router;
