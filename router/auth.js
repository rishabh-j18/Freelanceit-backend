const express=require('express');
const router=new express.Router();

const {registerWithEmail, verifyemail, noncegeneration, registerWithWallet, updateProfile, loginWithEmail, loginWithWallet, generateLoginNonce, verifyotp, getProfile}=require('../controller/authcontrollers');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register/email',registerWithEmail);
router.post('/verify-email',verifyemail);
router.post('/verify-otp',verifyotp);
router.post('/register/wallet',registerWithWallet);
router.post('/nonce',noncegeneration);
router.post(`/login-nonce`,generateLoginNonce);
router.put('/profile',authMiddleware,updateProfile);
router.post('/login/email',loginWithEmail);
router.post('/login/wallet',loginWithWallet);
router.get('/profile', authMiddleware ,getProfile);


module.exports=router;