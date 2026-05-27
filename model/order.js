const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OrderSchema = new Schema({

  userEmail: {
    type: String,
    required: true
  },

  items: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Products'
      },
      title: String,
      imageUrl: String,
      price: Number,
      quantity: Number
    }
  ],

  buyer: {
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true }
  },

  shippingMethod: {
    type: String,
    default: 'Free Shipping'
  },

  totalAmount: {
    type: Number,
    required: true
  },

  paymentMethod: {
    type: String,
    enum: ['COD', 'RAZORPAY'],
    default: 'COD'
  },

  razorpayOrderId: String,
  razorpayPaymentId: String,

  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed','expired'],
    default: 'pending'
  },

  status: {
    type: String,
    enum: ['placed', 'shipped', 'delivered', 'cancelled'],
    default: 'placed'
  },
  cancelReason:{
    type:String,
    default:''
  },

  cancelledBy:{
    type:String,
    default:''
  },
  refundStatus: {
  type: String,
  default: 'none'
},

refundId: {
  type: String,
  default: ''
},

  deliveredAt: Date,

  isDeleted: {
    type: Boolean,
    default: false
  },

  createdAt: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model('Order', OrderSchema);