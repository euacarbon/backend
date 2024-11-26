const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const nftController = require('../controllers/nftController');

router.post('/mintNFT', authMiddleware, nftController.mintNFT);

module.exports = router;
