const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const tokenController = require('../controllers/tokenController');

// Add getXRPBalance route
router.get('/getXRPBalance', authMiddleware, tokenController.getBalance);
router.post('/send', authMiddleware, tokenController.sendXRP);
router.post('/issueToken', tokenController.issueToken);
router.post('/createTrustLine', authMiddleware, tokenController.createTrustLine);
router.get('/getTokenBalance', authMiddleware, tokenController.getTokenBalance);
router.post('/sendToken', authMiddleware, tokenController.sendTokens);
router.post('/tradeToken', authMiddleware, tokenController.tradeToken);
router.post('/getAvailableSwapPath', authMiddleware, tokenController.getAvailableSwapPath);



module.exports = router;
