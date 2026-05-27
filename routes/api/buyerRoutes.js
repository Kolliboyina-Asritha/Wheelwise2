// routes/buyerRoutes.js
const express = require('express');
const router = express.Router();
const buyerDetailsController = require('../../logcontroller/buyerDetailsController');
const verifyJWT = require('../../middleware/verifyJWT');

router.use(verifyJWT);

router.get('/details', buyerDetailsController.getDetails);
router.post('/details', buyerDetailsController.upsertBuyerDetails);
router.put('/details', buyerDetailsController.upsertBuyerDetails);

module.exports = router;
