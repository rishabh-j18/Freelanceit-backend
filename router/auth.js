const express=require('express');
const router=new express.Router();

const {registerWithEmail, verifyemail, noncegeneration, registerWithWallet, updateProfile, loginWithEmail}=require('../controller/authcontrollers');

router.post('/registeremail',registerWithEmail);
router.post('/register-metamask',verifyemail);
router.post('/verify',registerWithWallet);
router.get('/generate-nonce',noncegeneration);
router.post('/updateprofile',updateProfile);
router.post('login-email',loginWithEmail);


module.exports=router;