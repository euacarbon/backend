
const xrpl = require("xrpl");
const config = require('../config/config');
const xummSdk  = require('../services/xummService')
const WebSocket = require('ws');


const createTrustLine = async (userAccount, issuerAddress, currencyCode, value = '10000000') => {
  try {
    // Validate inputs
    if (!xrpl.isValidClassicAddress(userAccount)) {
      throw new Error('Invalid user account address.');
    }
    if (!xrpl.isValidClassicAddress(issuerAddress)) {
      throw new Error('Invalid issuer address.');
    }
    if (!currencyCode) {
      throw new Error('Currency code is required.');
    }

    if (isNaN(value) || parseFloat(value) <= 0) {
      throw new Error('Invalid value: Must be a positive decimal number as a string.');
    }

    const formattedValue = value.toString();
    const trustLineTx = {
      TransactionType: 'TrustSet',
      Account: userAccount,
      LimitAmount: {
        currency: currencyCode,
        issuer: issuerAddress,
        value: formattedValue
      },
      Flags: 0x00020000, // tfSetNoRipple
    };
    
     const trustLinePayload = {
      txjson: trustLineTx, // Wrap transaction in txjson
      custom_meta: {
        instruction: `Please sign to create a trust line for ${currencyCode} with issuer ${issuerAddress}`,
      },
    };
    const response = await xummSdk.payload.create(trustLinePayload);

    if (!response || !response.next || !response.next.always) {
      throw new Error('Failed to create XUMM transaction payload.');
    }
    return {
      uuid: response.uuid,
      nextUrl: response.next.always,
      message: 'Trust line transaction created successfully. Use the provided URL to sign.',
    };
  } catch (error) {
    console.error('Error in createTrustLine:', error.message);
    throw error;
  }
};


const getXRPBalance = async (account) => {
  if (!account) {
    throw new Error('Account is required.');
  }

  const ws = new WebSocket(config.xrpNodeUrl); 

  return new Promise((resolve, reject) => {
    ws.on('open', () => {
      const request = {
        id: 1,
        command: 'account_info',
        account,
      };

      ws.send(JSON.stringify(request));
    });

    ws.on('message', (message) => {
      const response = JSON.parse(message);

      if (response.status !== 'success') {
        reject(new Error(response.error_message || 'Failed to fetch account info.'));
        ws.close();
        return;
      }

      const balance = parseInt(response.result.account_data.Balance, 10) / 1000000; // Convert drops to XRP

      const result = {
        balance,
        account: response.result.account_data.Account,
      };

      ws.close();
      resolve(result);
    });

    ws.on('error', (err) => {
      ws.close();
      reject(err);
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed.');
    });
  });
};




const sendXRP = async (sender, destination, amount) => {
  try {
    // Validate addresses
    if (!xrpl.isValidClassicAddress(sender)) {
      throw new Error("Invalid sender address.");
    }
    if (!xrpl.isValidClassicAddress(destination)) {
      throw new Error("Invalid destination address.");
    }

    // Check sender's balance
    const balanceData = await getXRPBalance(sender);
    const senderBalance = balanceData.balance;

    if (senderBalance < amount) {
      throw new Error("Insufficient balance for transaction.");
    }

    // Create XUMM payload for transaction
    const payload = {
      TransactionType: 'Payment',
      Account: sender,
      Destination: destination,
      Amount: xrpl.xrpToDrops(amount), // Convert XRP to drops
    };

    // Submit the payload
    const response = await xummSdk.payload.create(payload);

    if (!response) {
      throw new Error("Failed to create transaction payload.");
    }

    return {
      uuid: response.uuid, // Payload UUID
      nextUrl: response.next.always, // URL for signing the payload
    };
  } catch (error) {
    console.error("Error in sendXRP:", error.message);
    throw error;
  }
};



const COLD_ADDRESS = process.env.COLD_ADDRESS;
const CURRENCY_CODE = process.env.CURRENCY_CODE;

if (!COLD_ADDRESS || !CURRENCY_CODE) {
  throw new Error('Please set COLD_ADDRESS and CURRENCY_CODE in the .env file');
}

// send tokens 

const sendTokens = async (sender, destination, amount) => {
  try {
    // Validate addresses
    if (!xrpl.isValidClassicAddress(sender)) {
      throw new Error("Invalid sender address.");
    }
    if (!xrpl.isValidClassicAddress(destination)) {
      throw new Error("Invalid destination address.");
    }

    const calculateSendMax = (amount, feePercent) => {
      const feeMultiplier = 1 + feePercent / 100; 
      const sendMax = parseFloat(amount) * feeMultiplier;
      return sendMax.toFixed(8); 
    };
    
    const payload = {
      TransactionType: 'Payment',
      Account: sender, 
      Destination: destination, 
      Amount: {
        currency: CURRENCY_CODE, 
        issuer: COLD_ADDRESS, 
        value: amount.toString(), 
      },
      SendMax: {
        currency: CURRENCY_CODE,
        issuer: COLD_ADDRESS,
        value: calculateSendMax(amount, 0.1), // Add 0.1% fee
      },
    };
    

    // Submit the payload
    const response = await xummSdk.payload.create(payload);

    if (!response) {
      throw new Error("Failed to create transaction payload.");
    }

    return {
      uuid: response.uuid, // Payload UUID
      nextUrl: response.next.always, // URL for signing the payload
    };
  } catch (error) {
    console.error("Error in sendTokens:", error.message);
    throw error;
  }
};





/**
 * Get token balance for an account using WebSocket RPC
 * @param {string} account - The XRP Ledger account to check.
 * @returns {Promise<{ balance: string, currency: string, issuer: string }>} Token balance details.
 */
const getTokenBalance = async (account) => {
  if (!account) {
    throw new Error('Account is required.');
  }

  const ws = new WebSocket(config.xrpNodeUrl); // WebSocket URL from .env


  return new Promise((resolve, reject) => {
    ws.on('open', () => {
      const request = {
        id: 1,
        command: 'account_lines',
        account,
      };

      ws.send(JSON.stringify(request));
    });

    ws.on('message', (message) => {
      const response = JSON.parse(message);

      if (response.status !== 'success') {
        reject(new Error(response.error_message || 'Failed to fetch account lines.'));
        ws.close();
        return;
      }

      const token = response.result.lines.find(
        (line) =>
          line.account === COLD_ADDRESS &&
          line.currency === CURRENCY_CODE
      );

      ws.close();

      if (!token) {
        reject(new Error(`No balance found for currency ${CURRENCY_CODE} issued by ${COLD_ADDRESS}.`));
        return;
      }

      resolve({
        balance: token.balance,
        currency: token.currency,
        issuer: token.account,
      });
    });

    ws.on('error', (err) => {
      ws.close();
      reject(err);
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed.');
    });
  });
};


module.exports = {
    getXRPBalance,
    sendXRP,
    getTokenBalance,
    createTrustLine,
    sendTokens
    
};
