const mongoose=require('mongoose');
const Schema=mongoose.Schema;
const reviews=new Schema({
    user:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Userd',
    required:true
  },

  rating:{
    type:Number,
    required:true,
    min:1,
    max:5
  },

  message:{
    type:String,
    required:true,
    trim:true
  },

  createdAt:{
    type:Date,
    default:Date.now
  }
})
module.exports=mongoose.model('Feedback',reviews);