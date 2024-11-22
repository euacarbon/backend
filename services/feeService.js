exports.calculateFee = (amount) => {
    const feePercentage = 0.001; // 0.1%
    return amount * feePercentage;
  };
  