const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const walletAuthMiddleware = require('../middlewares/walletAuthMiddleware');

router.post('/send-xrp', walletAuthMiddleware, transactionController.sendXRP);
router.post('/send-token', walletAuthMiddleware, transactionController.sendToken);

module.exports = router;
