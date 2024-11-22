const tokenService = require('../services/tokenService');

exports.sendXRP = async (req, res, next) => {
  try {
    const { toAddress, amount } = req.body;
    const fromAddress = req.walletAddress; // Obtained from walletAuthMiddleware
    const result = await xrpService.sendXRP(fromAddress, toAddress, amount);
    res.status(200).json({ message: 'XRP sent successfully', data: result });
  } catch (error) {
    next(error);
  }
};

exports.sendToken = async (req, res, next) => {
  try {
    const { toAddress, amount } = req.body;
    const fromAddress = req.walletAddress;
    const fee = await tokenService.calculateFee(amount);
    const result = await tokenService.sendToken(fromAddress, toAddress, amount, fee);
    res.status(200).json({ message: 'Token sent successfully', data: result });
  } catch (error) {
    next(error);
  }
};
