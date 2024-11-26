
const xrpl = require("xrpl");
const config = require('../config/config');
const xummSdk  = require('../services/xummService')
const WebSocket = require('ws');


const createTrustLine = async (userAccount, issuerAddress, currencyCode, value = '10000000') => {
  try {
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
      txjson: trustLineTx, 
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

      const balance = parseInt(response.result.account_data.Balance, 10) / 1000000; 

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
      uuid: response.uuid, 
      nextUrl: response.next.always, 
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
    if (!xrpl.isValidClassicAddress(sender)) {
      throw new Error("Invalid sender address.");
    }
    if (!xrpl.isValidClassicAddress(destination)) {
      throw new Error("Invalid destination address.");
    }

    // const calculateSendMax = (amount, feePercent) => {
    //   const feeMultiplier = feePercent / 100; 
    //   const sendMax = parseFloat(amount) * feeMultiplier;
    //   return sendMax.toFixed(8); 
    // };

    const feePercentage = 0.1;
    const amountForSendMax = parseFloat(amount) + parseFloat((amount * feePercentage / 100));
    
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
        // value: calculateSendMax(amount, 0.1), // Add 0.1% fee
        value : amountForSendMax
      },
    };
    

    // Submit the payload
    const response = await xummSdk.payload.create(payload);

    if (!response) {
      throw new Error("Failed to create transaction payload.");
    }

    return {
      uuid: response.uuid, 
      nextUrl: response.next.always,
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
        console.warn(
          `No balance found for currency ${CURRENCY_CODE} issued by ${COLD_ADDRESS}. Returning balance as 0.`
        );
        resolve({
          balance: '0',
          currency: CURRENCY_CODE,
          issuer: COLD_ADDRESS,
        });
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



// TRADE TOKEN

const tradeToken = async (account, action, amount, price) => {
  try {
    if (!xrpl.isValidClassicAddress(account)) {
      throw new Error("Invalid account address.");
    }

    let payload;

    if (action === "buy") {
      payload = {
        TransactionType: "OfferCreate",
        Account: account,
        TakerPays: {
          currency: CURRENCY_CODE,
          issuer: COLD_ADDRESS,
          value: amount.toString(), 
        },
        TakerGets: xrpl.xrpToDrops(price.toString()), 
      };
    } else if (action === "sell") {
      payload = {
        TransactionType: "OfferCreate",
        Account: account,
        TakerPays: xrpl.xrpToDrops(price.toString()), // Convert XRP to drops
        TakerGets: {
          currency: CURRENCY_CODE,
          issuer: COLD_ADDRESS,
          value: amount.toString(), 
        },
      };
    } else {
      throw new Error("Invalid action. Use 'buy' or 'sell'.");
    }

    // Create the transaction payload in XUMM
    const response = await xummSdk.payload.create({
      txjson: payload,
    });

    if (!response || !response.next) {
      throw new Error("Failed to create transaction payload.");
    }

    return {
      uuid: response.uuid, 
      nextUrl: response.next.always, 
    };
  } catch (error) {
    console.error("Error in tradeToken:", error.message);
    throw error;
  }
};


// GET PATHS 

const getAvailableSwapPath = async (data) => {
  const {
    source_account,
    destination_account,
    value,
  } = data;

  if (!source_account || !destination_account || !value ) {
    throw new Error('All parameters (source_account, destination_account, value) are required.');
  }

  const ws = new WebSocket(config.xrpNodeUrl); // WebSocket URL from .env

  return new Promise((resolve, reject) => {
    ws.on('open', () => {
      const request = {
        id: 2,
        command: 'path_find',
        subcommand: 'create',
        source_account,
        destination_account,
        destination_amount: {
          value,
          currency: CURRENCY_CODE,
          issuer: COLD_ADDRESS,
        },
      };

      ws.send(JSON.stringify(request));
    });

    ws.on('message', (message) => {
      const response = JSON.parse(message);

      if (response.status !== 'success') {
        reject(new Error(response.error_message || 'Failed to find paths.'));
        ws.close();
        return;
      }

      const paths = response.result.paths_computed;

      ws.close();

      if (!paths || paths.length === 0) {
        reject(new Error('No swap paths found.'));
        return;
      }

      resolve(paths);
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
    sendTokens,
    tradeToken,
    getAvailableSwapPath
    
};
