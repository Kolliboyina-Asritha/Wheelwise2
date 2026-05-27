const User=require('../model/userd');

const handleLogout= async (req,res)=>{
    const cookies=req.cookies;

    if(!cookies?.jwt) return res.sendStatus(204);//no content
    const refreshToken=cookies.jwt;
    //is refreshtoken in DB
    const foundUser=await User.findOne({refreshToken}).exec();
    if(!foundUser) {
        res.clearCookie('jwt',{httpOnly:true,secure:true,sameSite:'None'});
        return res.sendStatus(204);//forbidden
    }
    //delete the refresh token in DB
    foundUser.refreshToken='';
    const result=await foundUser.save();
    console.log(result);
    res.clearCookie('jwt',{httpOnly:true,secure:true,sameSite:'None'});
    res.sendStatus(204);
 
};
module.exports={handleLogout};
