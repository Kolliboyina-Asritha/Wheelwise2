const User=require('../model/userd');
const jwt=require('jsonwebtoken');
const handleRefreshToken= async (req,res)=>{
    const cookies=req.cookies;

    if(!cookies?.jwt) return res.sendStatus(401);//unauthorised
    console.log(cookies.jwt);
    const refreshToken=cookies.jwt;

    const foundUser=await User.findOne({refreshToken}).exec();
    if(!foundUser) return res.sendStatus(403);//forbidden
    jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        (err,decoded)=>{
            if(err||foundUser.email!==decoded.email) return res.sendStatus(403);
            const roles=Object.values(foundUser.roles);
            const accessToken=jwt.sign(
                {
                    "UserInfo":{
                        "id":foundUser._id.toString(),
                       "email":foundUser.email,
                        "roles":roles
                    }           
                },   
                process.env.ACCESS_TOKEN_SECRET,
                {expiresIn:'10m'}
            );
            res.json({accessToken})
        }
    )
}
module.exports={handleRefreshToken}