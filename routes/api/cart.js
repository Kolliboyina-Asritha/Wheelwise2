const express = require('express');
const router = express.Router();
const Cart = require('../../model/cart');
const Products = require('../../model/products');
const verifyJWT = require('../../middleware/verifyJWT');

// ✅ Add vehicle to cart
router.post('/', verifyJWT, async (req, res) => {
  const userEmail = req.user;
  const { vehicleId } = req.body;

  // Prevent duplicate
  const exists = await Cart.findOne({ userEmail, vehicleId });
  if (exists) return res.status(400).json({ message: 'Already in cart' });

  const cartItem = new Cart({ userEmail, vehicleId });
  await cartItem.save();

  res.status(201).json({ message: 'Vehicle added to cart' });
});

// ✅ Get all cart items for user
router.get('/', verifyJWT, async (req, res) => {
  const userEmail = req.user;

  const cartItems = await Cart.find({ userEmail }).populate('vehicleId');

  // Optional: Remove invalid cart items (whose product was deleted)
  for (const item of cartItems) {
    if (!item.vehicleId) {
      await Cart.findByIdAndDelete(item._id);
    }
  }

  // Only include valid vehicle references
  const formatted = cartItems
    .filter(item => item.vehicleId) // avoid null reference
    .map(item => ({
      _id: item._id,
      vehicleId: item.vehicleId._id,
      title: item.vehicleId.title,
      price: item.vehicleId.price,
      imageUrl: item.vehicleId.imageUrl
    }));

  res.json(formatted);
});

// ✅ Delete item from cart
router.delete('/:id', verifyJWT, async (req, res) => {
  await Cart.findByIdAndDelete(req.params.id);
  res.sendStatus(204);
});

module.exports = router;
