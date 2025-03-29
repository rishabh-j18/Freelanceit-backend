const express=require('express');
const router=new express.Router();

const {registerWithEmail, verifyemail, noncegeneration, registerWithWallet, updateProfile, loginWithEmail, loginWithWallet, generateLoginNonce, verifyotp, getProfile}=require('../controller/authcontrollers');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/registeremail',registerWithEmail);
router.post('/verify',verifyemail);
router.post('/verify-otp',verifyotp);
router.post('/register-metamask',registerWithWallet);
router.post('/generate-nonce',noncegeneration);
router.post(`/generate-login-nonce`,generateLoginNonce);
router.post('/updateprofile',updateProfile);
router.post('/login-email',loginWithEmail);
router.post('/login-metamask',loginWithWallet);
router.get('/profile', authMiddleware ,getProfile);


module.exports=router;