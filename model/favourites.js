const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const favouritesSchema = new Schema({
  email: {
    type: String,
    required: true,
    index: true
  },
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Products', // assuming 'Products' is your vehicle/product model
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Favourites', favouritesSchema);
