const nftService = require('../services/nftService');


exports.mintNFT = async (req, res, next) => {
    try {
      const { account, amountBurned } = req.body;
  
      if (!account || amountBurned === undefined) {
        return res.status(400).json({
          message: 'Account, amountBurned  are required.',
        });
      }
  
      if (typeof amountBurned !== 'string' || amountBurned <= 0) {
        return res.status(400).json({
          message: 'amountBurned must be a positive number.',
        });
      }
  
      const transaction = await nftService.mintNFT(account, amountBurned);
  
      res.status(200).json({
        message: 'Transaction payload created. Await user signature.',
        payload: transaction,
      });
    } catch (error) {
      next(error); 
    }
  };