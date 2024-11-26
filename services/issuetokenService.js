require('dotenv').config();
const xrpl = require('xrpl');
const config = require('../config/config');

const ISSUER_ADDRESS = process.env.COLD_ADDRESS;
const ISSUER_SECRET = process.env.COLD_SECRET;
const HOT_ADDRESS = process.env.HOT_ADDRESS;
const HOT_SECRET = process.env.HOT_SECRET;

if (!ISSUER_ADDRESS || !ISSUER_SECRET || !HOT_ADDRESS || !HOT_SECRET) {
  throw new Error('Please set COLD_ADDRESS, COLD_SECRET, HOT_ADDRESS, and HOT_SECRET in the .env file');
}

const issueToken = async (currencyCode, tokenSupply, domain) => {
  try {
    if (!currencyCode || !tokenSupply || !domain) {
      throw new Error('currencyCode, tokenSupply, and domain are required');
    }
    const client = new xrpl.Client(config.xrpNodeUrl);

    console.log('Connecting to XRPL Testnet...');
    await client.connect();

    // Configure Issuer Account Settings
    const issuerWallet = xrpl.Wallet.fromSeed(ISSUER_SECRET);
    const issuerSettingsTx = {
      TransactionType: 'AccountSet',
      Account: ISSUER_ADDRESS,
      TransferRate: 1001000000, // 0.1% fee
      SetFlag: xrpl.AccountSetAsfFlags.asfDefaultRipple,
      Domain: Buffer.from(domain).toString('hex'), // Convert domain to hex
    };

    const issuerSettingsPrepared = await client.autofill(issuerSettingsTx);
    const issuerSettingsSigned = issuerWallet.sign(issuerSettingsPrepared);

    console.log('Configuring issuer account settings...');
    const issuerSettingsResult = await client.submitAndWait(issuerSettingsSigned.tx_blob);

    if (issuerSettingsResult.result.meta.TransactionResult !== 'tesSUCCESS') {
      throw new Error(`Error configuring issuer account: ${issuerSettingsResult.result.meta.TransactionResult}`);
    }
    console.log('Issuer account settings configured successfully.');

    // // Configure Hot Wallet
    const hotWallet = xrpl.Wallet.fromSeed(HOT_SECRET);
    // const hotWalletSettingsTx = {
    //   TransactionType: 'AccountSet',
    //   Account: HOT_ADDRESS,
    //   SetFlag: xrpl.AccountSetAsfFlags.asfRequireAuth,
    //   Flags: xrpl.AccountSetTfFlags.tfDisallowXRP | xrpl.AccountSetTfFlags.tfRequireDestTag,
    // };

    // const hotWalletSettingsPrepared = await client.autofill(hotWalletSettingsTx);
    // const hotWalletSettingsSigned = hotWallet.sign(hotWalletSettingsPrepared);

    // console.log('Configuring hot wallet settings...');
    // const hotWalletSettingsResult = await client.submitAndWait(hotWalletSettingsSigned.tx_blob);

    // if (hotWalletSettingsResult.result.meta.TransactionResult !== 'tesSUCCESS') {
    //   throw new Error(`Error configuring hot wallet: ${hotWalletSettingsResult.result.meta.TransactionResult}`);
    // }
    // console.log('Hot wallet settings configured successfully.');

    // Create Trust Line
    const trustLineTx = {
      TransactionType: 'TrustSet',
      Account: HOT_ADDRESS,
      Flags: 0x00020000, // tfSetNoRipple
      LimitAmount: {
        currency: currencyCode,
        issuer: ISSUER_ADDRESS,
        value: '10000000000', 
      },
    };

    const trustLinePrepared = await client.autofill(trustLineTx);
    const trustLineSigned = hotWallet.sign(trustLinePrepared);

    console.log('Creating trust line...');
    const trustLineResult = await client.submitAndWait(trustLineSigned.tx_blob);

    if (trustLineResult.result.meta.TransactionResult !== 'tesSUCCESS') {
      throw new Error(`Error creating trust line: ${trustLineResult.result.meta.TransactionResult}`);
    }
    console.log('Trust line created successfully.');

    // Issue Tokens
    const issueTokenTx = {
      TransactionType: 'Payment',
      Account: ISSUER_ADDRESS,
      
      DeliverMax: {
        currency: currencyCode,
        value: tokenSupply,
        issuer: ISSUER_ADDRESS,
      },
      Destination: HOT_ADDRESS,
      
    };

    const issueTokenPrepared = await client.autofill(issueTokenTx);
    const issueTokenSigned = issuerWallet.sign(issueTokenPrepared);

    console.log(`Issuing ${tokenSupply} ${currencyCode}...`);
    const issueTokenResult = await client.submitAndWait(issueTokenSigned.tx_blob);

    if (issueTokenResult.result.meta.TransactionResult !== 'tesSUCCESS') {
      throw new Error(`Error issuing tokens: ${issueTokenResult.result.meta.TransactionResult}`);
    }

    console.log('Tokens issued successfully.');
    await client.disconnect();

    return {
      success: true,
      tx_hash: issueTokenSigned.hash,
    };
  } catch (error) {
    console.error('Error in issueToken:', error.message);
    throw error;
  }
};

module.exports = {
  issueToken,
};
