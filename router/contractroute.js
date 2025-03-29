const express=require('express');
const { submitTc, reviewTc, updateTc, fundEscrow } = require('../controller/contractcontroller');
const router=express.Router();


router.post('/:contractId/submit-tc',submitTc);
router.post('/:contractId/review-tc',reviewTc);
router.put('/:contractId/update-tc',updateTc)
router.post('/:contractId/fund-escrow',fundEscrow)



module.exports=router;