
const express = require('express');
const router = express.Router();
const Products = require('../../model/products');
const Brands = require('../../model/brands');
const mongoose = require('mongoose');


router.post('/search-vehicles', async (req, res) => {
  try {
    const filters = {};
    const body = req.body;

    console.log("Received search filters:", body);

    // Convert brand name to ObjectId
    if (body.brand) {
      const brandDoc = await Brands.findOne({ name: body.brand });
      if (brandDoc) {
        filters.brand = brandDoc._id;
      } else {
        return res.json([]); // No such brand found
      }
    }

    if (body.model) filters.model = new RegExp(`^${body.model}$`, 'i');
    if (body.year && !isNaN(body.year)) filters.year = parseInt(body.year);
    if (body.price && !isNaN(body.price)) filters.price = parseInt(body.price.toString().replace(/[^\d]/g, ''));
    if (body.mileage) filters.mileage = body.mileage;
    if (body.condition) filters.condition = new RegExp(`^${body.condition}$`, 'i');
    if (body.BodyType) filters.BodyType = new RegExp(`^${body.BodyType}$`, 'i');

    console.log("Final Mongoose Query Filters:", filters);

    const results = await Products.find(filters).populate('brand');
    res.json(results);
  } catch (error) {
    console.error("❌ Error during /search-vehicles:", error);
    res.status(500).json({ error: 'Search failed' });
  }
});

module.exports = router;



