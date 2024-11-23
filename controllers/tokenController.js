const tokenService = require('../services/tokenService');
const issueTokenService = require('../services/issuetokenService');

exports.issueToken = async (req, res, next) => {
  try {
    const { currency_code, token_supply, domain } = req.body;

    if (!currency_code || !token_supply || !domain) {
      return res.status(400).json({ message: 'currency_code, token_supply, and domain are required' });
    }

    const result = await issueTokenService.issueToken(currency_code, token_supply, domain);

    res.status(200).json({ message: 'Token issuance successful', data: result });
  } catch (error) {
    next(error); // Pass the error to the next middleware for centralized error handling
  }
};


// createTrustLine function
exports.createTrustLine = async (req, res, next) => {
  try {
    const { userAccount, issuerAddress, currencyCode, value } = req.body;

    // Validate request body
    if (!userAccount || !issuerAddress || !currencyCode) {
      return res.status(400).json({
        message: 'userAccount, issuerAddress, and currencyCode are required.',
      });
    }

    // Call the service to create the trust line payload
    const trustLinePayload = await tokenService.createTrustLine(userAccount, issuerAddress, currencyCode, value);

    res.status(200).json({
      message: 'Trust line payload created. Await user signature.',
      payload: trustLinePayload,
    });
  } catch (error) {
    next(error);
  }
};


// buyToken function
exports.buyToken = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const walletAddress = req.walletAddress;

    const result = await tokenService.buyToken(walletAddress, amount);

    res.status(200).json({ message: 'Token purchase initiated', data: result });
  } catch (error) {
    next(error);
  }
};

exports.getBalance = async (req, res, next) => {
    try {
      // Extract the account address from query parameters
      const { account } = req.query;
  
      if (!account) {
        return res.status(400).json({ message: 'Account query parameter is required.' });
      }
        const balance = await tokenService.getXRPBalance(account);
  
      res.status(200).json({ account, balance });
    } catch (error) {
      console.error('Error fetching XRP balance:', error);
      next(error);
    }
  };
  


exports.sendTokens = async (req, res, next) => {
  try {
    const { sender, destination, amount } = req.body;

    // Validate request body
    if (!sender || !destination || !amount) {
      return res.status(400).json({ message: 'Sender, destination, and amount are required.' });
    }

    // Call the service to create the payload
    const transaction = await tokenService.sendTokens(sender, destination, amount);

    res.status(200).json({
      message: 'Transaction payload created. Await user signature.',
      payload: transaction,
    });
  } catch (error) {
    next(error);
  }
};


exports.sendXRP = async (req, res, next) => {
  try {
    const { sender, destination, amount } = req.body;

    // Validate request body
    if (!sender || !destination || !amount) {
      return res.status(400).json({ message: 'Sender, destination, and amount are required.' });
    }

    // Call the service to create the payload
    const transaction = await tokenService.sendXRP(sender, destination, amount);

    res.status(200).json({
      message: 'Transaction payload created. Await user signature.',
      payload: transaction,
    });
  } catch (error) {
    next(error);
  }
};


exports.getTokenBalance = async (req, res, next) => {
  try {
    const { account } = req.query;

    // Validate request parameters
    if (!account) {
      return res.status(400).json({ message: 'Account is required in the query parameters.' });
    }

    // Call the service to fetch the token balance
    const result = await tokenService.getTokenBalance(account);

    res.status(200).json({
      message: 'Token balance retrieved successfully.',
      data: result,
    });
  } catch (error) {
    console.error('Error in getTokenBalance controller:', error.message);
    next(error); // Pass the error to the centralized error handler
  }
};
