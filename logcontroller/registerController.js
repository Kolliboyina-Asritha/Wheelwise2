const User=require('../model/userd');
const bcrypt=require('bcrypt');

const handleNewUser=async (req,res)=>{
    const{firstname,lastname,email,mobileno,pwd}=req.body;
    if(!pwd||!email) return res.status(400).json({'message':'username and password are required'});
    const duplicate = await User.findOne({ email }).exec();
   

    if(duplicate) return res.status(409).json({'message':'duplicate'});
     try{
       //encrypt the password
       const hashedpwd=await bcrypt.hash(pwd,10);//It hashes the plain-text password (pwd) using bcrypt, and stores the result in the variable hashedpwd
       //create and store new user
       const result= await User.create({
          firstname,
          lastname,
          "email":email,
          mobileno,
          "password":hashedpwd
        });

        //const newUser=new User();
        //const result=await newUser.save()

       
       console.log(result);
       res.status(201).json({'success':`new user created!`});
    }
    catch (err){
          console.error('Registration Error:', err);  // 👈 Add this

        res.status(500).json({'message':err.message});
    }

}
module.exports={handleNewUser};