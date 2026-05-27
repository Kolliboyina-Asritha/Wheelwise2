
const mongoose=require('mongoose');
const Schema=mongoose.Schema;
const productsSchema=new Schema({
    title:{
        type:String,
        required:true
    },
    condition:{
        type:String,
        required:true
    },
    brand:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Brands',
        required:true
    },
    price:{
        type:Number,
        required:true
    },
    model:{
        type:String,
        required:true
    },
    year:{
        type:Number,
        required:true
    },
    mileage:{
        type:String,
        required:true
    },
    BodyType:{
        type:String,
        required:true
    },
    imageUrl:{
        type:String,
        required:true
    },

    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Userd', required: true }
},{timestamps:true});
module.exports=mongoose.model('Products',productsSchema);