const express = require('express');
const router = express.Router();
const verifyJWT = require('../../middleware/verifyJWT');
const verifyRoles = require('../../middleware/verifyroles');
const Products = require('../../model/products');
const Brands = require('../../model/brands');
const ROLES_LIST = require('../../config/role_list');
const User = require('../../model/userd'); // Your user model

// ✅ Create Product (only for Seller)
router.post('/', verifyJWT, verifyRoles(ROLES_LIST.Seller), async (req, res) => {
  const {
    title,
    price,
    brand, // brand name
    year,
    model,
    mileage,
    BodyType,
    condition,
    imageUrl
  } = req.body;

  try {
    const email = req.user;
    const seller = await User.findOne({ email });

    if (!seller) return res.status(404).json({ message: 'Seller not found' });

    const brandDoc = await Brands.findOne({ name: new RegExp('^' + brand + '$', 'i') });

    if (!brandDoc) {
      return res.status(400).json({ message: 'Brand not found. Please add it first.' });
    }

    const newProduct = await Products.create({
      title,
      price,
      brand: brandDoc._id,
      year,
      model,
      mileage,
      BodyType,
      condition,
      imageUrl,
      seller: seller._id
    });

    res.status(201).json({ message: 'Product created', product: newProduct });

  } catch (err) {
    res.status(500).json({ message: 'Error creating product', error: err.message });
  }
});

// ✅ Get all products for this seller
router.get('/', verifyJWT, verifyRoles(ROLES_LIST.Seller), async (req, res) => {
  try {
    const email = req.user;
    const seller = await User.findOne({ email });
    if (!seller) return res.status(404).json({ message: 'Seller not found' });

    const products = await Products.find({ seller: seller._id }).populate('brand');
    res.json(products);

  } catch (err) {
    res.status(500).json({ message: 'Error fetching products', error: err.message });
  }
});

// ✅ Get products by brand name
router.get('/by-brand-name/:brandName', async (req, res) => {
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


router.get('/:id',async (req, res) => {
  try {
    const vehicle = await Products.findById(req.params.id).populate('brand');
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    res.json(vehicle);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});
// ✅ Update product by ID (Seller only)
router.put('/:id', verifyJWT, verifyRoles(ROLES_LIST.Seller), async (req, res) => {
  const {
    title,
    price,
    brand, // brand name (optional)
    year,
    model,
    mileage,
    BodyType,
    condition,
    imageUrl
  } = req.body;

  try {
    const email = req.user;
    const seller = await User.findOne({ email });
    if (!seller) return res.status(404).json({ message: 'Seller not found' });

    const product = await Products.findOne({ _id: req.params.id, seller: seller._id });
    if (!product) return res.status(404).json({ message: 'Product not found or unauthorized' });

    // If brand name is given, fetch new brand document
    if (brand) {
      const brandDoc = await Brands.findOne({ name: new RegExp('^' + brand + '$', 'i') });
      if (!brandDoc) return res.status(400).json({ message: 'Brand not found' });
      product.brand = brandDoc._id;
    }

    // Update fields
    product.title = title || product.title;
    product.price = price || product.price;
    product.year = year || product.year;
    product.model = model || product.model;
    product.mileage = mileage || product.mileage;
    product.BodyType = BodyType || product.BodyType;
    product.condition = condition || product.condition;
    product.imageUrl = imageUrl || product.imageUrl;

    const updatedProduct = await product.save();
    res.json({ message: 'Product updated successfully', product: updatedProduct });

  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ message: 'Error updating product', error: err.message });
  }
});

// ✅ Delete product by ID (Seller only)
router.delete('/:id', verifyJWT, verifyRoles(ROLES_LIST.Seller), async (req, res) => {
  try {
    const email = req.user;
    const seller = await User.findOne({ email });
    if (!seller) return res.status(404).json({ message: 'Seller not found' });

    const product = await Products.findOneAndDelete({ _id: req.params.id, seller: seller._id });
    if (!product) return res.status(404).json({ message: 'Product not found or unauthorized' });

    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ message: 'Error deleting product', error: err.message });
  }
});

module.exports = router;