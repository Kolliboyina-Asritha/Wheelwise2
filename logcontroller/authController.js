require('dotenv').config();
const User=require('../model/userd');

const ROLES_LIST = require('../config/role_list');
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');

const handleLogin=async (req,res)=>{
    const {email,pwd}=req.body;
    if(!email||!pwd) return res.status(400).json({'message':'email and passwaord are required'});
    const foundUser=await User.findOne({ email }).exec();
    if(!foundUser) return res.sendStatus(401);
    const match=await bcrypt.compare(pwd,foundUser.password);
    if(match){
        const roles = Object.values(foundUser.roles);
        

        const accessToken=jwt.sign(
            {
                "UserInfo":{
                    "id": foundUser._id.toString(),
                   "email":foundUser.email,
                  
                   "roles":roles
                } 
            },
            process.env.ACCESS_TOKEN_SECRET,
            {expiresIn:'10m'}
        );
        const refreshToken=jwt.sign(
            {"email":foundUser.email},
            process.env.REFRESH_TOKEN_SECRET,
            {expiresIn:'1d'}
        );
        foundUser.refreshToken=refreshToken;
        const result=await foundUser.save();
        console.log(result);
        
        res.cookie('jwt', refreshToken, {
         httpOnly: true,
        secure:true,
         maxAge: 24*60*60*1000, // 10 minutes
         sameSite: 'None'
        });//If you're testing locally (e.g., http://localhost:3000), secure: true and sameSite: 'none' will silently block the cookie.

        const redirectTo = foundUser.roles?.Seller === ROLES_LIST.Seller
        ? '/seller/dashboard'
        : '/';

    res.json({ accessToken, redirectTo });
    }
    else{
        res.sendStatus(401);
    }

}
module.exports={handleLogin};
