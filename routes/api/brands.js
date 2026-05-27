const express = require('express');
const router = express.Router();
const Brands = require('../../model/brands');
const verifyJWT = require('../../middleware/verifyJWT');
const verifyRoles = require('../../middleware/verifyroles');
const ROLES_LIST = require('../../config/role_list');

// ✅ Add a new brand (Seller only)
router.post('/brands', verifyJWT, verifyRoles(ROLES_LIST.Seller), async (req, res) => {
  const { name, logourl } = req.body;
  const email = req.user;

  try {
    const brandExists = await Brands.findOne({ name, sellerEmail: email });
    if (brandExists) {
      return res.status(409).json({ message: 'Brand already exists' });
    }

    const brand = await Brands.create({ name, logourl, sellerEmail: email });
    res.status(201).json({ message: 'Brand added successfully', brand });

  } catch (err) {
    console.error('Add brand error:', err); // ✅ add this
  res.status(500).json({ message: 'Failed to add brand', error: err.message });

  }
});

// ✅ Get all brands added by this seller
router.get('/brands', verifyJWT, verifyRoles(ROLES_LIST.Seller), async (req, res) => {
  try {
    const email = req.user;
    const brands = await Brands.find({ sellerEmail: email });
    res.json(brands);

  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch brands', error: err.message });
  }
});
router.put('/brands/:id', verifyJWT, verifyRoles(ROLES_LIST.Seller), async (req, res) => {
  const email = req.user;
  const { name, logourl } = req.body;

  try {
    const brand = await Brands.findOne({ _id: req.params.id, sellerEmail: email });
    if (!brand) return res.status(404).json({ message: 'Brand not found or unauthorized' });

    brand.name = name || brand.name;
    brand.logourl = logourl || brand.logourl;

    const updated = await brand.save();
    res.json({ message: 'Brand updated successfully', brand: updated });
  } catch (err) {
    console.error('Update brand error:', err);
    res.status(500).json({ message: 'Failed to update brand', error: err.message });
  }
});

// ✅ Delete brand by ID
router.delete('/brands/:id', verifyJWT, verifyRoles(ROLES_LIST.Seller), async (req, res) => {
  const email = req.user;

  try {
    const brand = await Brands.findOneAndDelete({ _id: req.params.id, sellerEmail: email });
    if (!brand) return res.status(404).json({ message: 'Brand not found or unauthorized' });

    res.json({ message: 'Brand deleted successfully' });
  } catch (err) {
    console.error('Delete brand error:', err);
    res.status(500).json({ message: 'Failed to delete brand', error: err.message });
  }
});


module.exports = router;
