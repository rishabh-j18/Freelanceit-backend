const express=require('express');
const { submitTc, reviewTc, updateTc, fundEscrow } = require('../controller/contractcontroller');
const authMiddleware = require('../middleware/authMiddleware');
const router=express.Router();


router.post('/:contractId/submit-tc',authMiddleware,submitTc);
router.post('/:contractId/review-tc',authMiddleware,reviewTc);
router.put('/:contractId/update-tc',authMiddleware,updateTc)
router.post('/:contractId/fund-escrow',authMiddleware,fundEscrow)



module.exports=router;