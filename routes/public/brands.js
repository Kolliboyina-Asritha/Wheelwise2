// routes/public/brands.js
const express = require('express');
const router = express.Router();
const Brands = require('../../model/brands');

router.get('/brands',async (req, res) => {
  try {
    const brands = await Brands.find();
    res.json(brands);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch brands' });
  }
});

module.exports = router;
