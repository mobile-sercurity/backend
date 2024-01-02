const express = require("express");
const router = express.Router();
const paymentController = require("../../controller/payment-controller");

router.post('/addCard', paymentController.addNewCard);
router.post('/createCharge', paymentController.createCharge);

module.exports = router;