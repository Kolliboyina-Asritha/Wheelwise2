// /routes/public/products.js

const express = require('express');
const router = express.Router();
const Brands = require('../../model/brands');
const Products = require('../../model/products');
const verifyJWT=require('../../middleware/verifyJWT');
router.get('/by-brand-name/:brandName',verifyJWT, async (req, res) => {
  const { brandName } = req.params;

  try {
    const brand = await Brands.findOne({ name: new RegExp('^' + brandName + '$', 'i') });
    if (!brand) return res.status(404).json({ message: 'Brand not found' });

    const products = await Products.find({ brand: brand._id }).populate('brand');
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching products by brand name', error: err.message });
  }
});
module.exports=router;