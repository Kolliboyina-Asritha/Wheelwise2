const express=require('express');
const path=require('path');
const router=express.Router();
router.get('/',(req,res)=>{
res.sendFile(path.join(__dirname,'..','public','homepage.html'));
});
router.get('/seller/dashboard',(req,res)=>{
res.sendFile(path.join(__dirname,'..','public','seller.html'));
});

module.exports=router;
