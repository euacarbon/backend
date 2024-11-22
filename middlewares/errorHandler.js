module.exports = (err, req, res, next) => {
  console.error(err.stack);

  // XRP-related errors
  if (err.message.includes('server URI must start with') || err.name === 'ValidationError') {
    return res.status(400).json({ 
      message: 'Invalid XRPL node URI. Please check your XRPL_URL configuration.' 
    });
  }

  if (err.message.includes('account_info')) {
    return res.status(404).json({ 
      message: 'Account not found. Please check the provided account address.' 
    });
  }

  if (err.message.includes('Account Malformed')) {
    return res.status(404).json({ 
      message: 'Account Malformed. Please check the provided account address.' 
    });
  }

  if (err.message.includes('timeout')) {
    return res.status(504).json({ 
      message: 'Request to XRPL node timed out. Please try again later.' 
    });
  }

  // Generic server error
  res.status(500).json({ 
    message: 'Something went wrong.', 
    error: err.message 
  });
};
