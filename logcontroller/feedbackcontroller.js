const feedbacks=require('../model/feedback');
const User=require('../model/userd');
const createreview=async (req,res)=>{
    try{
     const {rating,message}=req.body;
     if(!rating||!message){
        return res.sendStatus(400).json({"message":"rating and msg are required"})
     }
     const founduser=await User.findById(req.id).exec();
     const feedback=await feedbacks.create({
        user:req.id,
        rating,
        message
     })
      res.status(201).json({success:true,feedback});

    }
    catch (err){
        console.error(err);
        res.status(500).json({
      message:'Server Error'
    });
} 
}
const getAllReviews = async(req,res)=>{

  try{

    const reviews = await feedbacks.find()

    .populate(
      'user',
      'firstname lastname email'
    )

    .sort({ createdAt:-1 });

    res.status(200).json(reviews);

  }catch(err){

    console.error(err);

    res.status(500).json({
      message:'Server Error'
    });

  }

};
const getUserReviews = async(req,res)=>{

  try{

    const reviews = await feedbacks.find({

      user:req.id

    })

    .populate(
      'user',
      'firstname lastname email'
    )

    .sort({ createdAt:-1 });

    res.status(200).json(reviews);

  }catch(err){

    console.error(err);

    res.status(500).json({
      message:'Server Error'
    });

  }

};
module.exports={
    createreview,
    getAllReviews,
    getUserReviews
}
