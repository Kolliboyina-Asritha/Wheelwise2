const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const cartSchema = new Schema({
  userEmail: { type: String, required: true },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Products', required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Cart', cartSchema);
