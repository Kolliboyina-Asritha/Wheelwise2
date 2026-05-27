
const express=require('express');
const router=express.Router();

const authController=require('../../logcontroller/authController');
router.post('/',authController.handleLogin);


module.exports=router;
