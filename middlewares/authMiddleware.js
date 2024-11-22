const xummSdk = require('../services/xummService');

module.exports = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }
    const userData = await xummSdk.verifyUserTokens(token);
    console.log('userData:', userData);
    
    const user = userData[0]; // Access the first object in the array
    if (!user || !user.active || user.expires <= Math.floor(Date.now() / 1000)) {
      return res.status(401).json({
        message: user 
          ? user.active 
            ? 'Expired token.' 
            : 'Inactive token.' 
          : 'Invalid token.'
      });
    }
    

      
    // req.walletAddress = userData.account;
    req.xummToken = token; // Store the token if needed in services

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ message: 'Invalid authentication.' });
  }
};
