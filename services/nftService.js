const xummSdk  = require('../services/xummService')
const IMAGE_URL = process.env.IMAGE_URL;
// Mint an NFT
const mintNFT = async (sender, amountBurned) => {
  try {
   
    const currentDate = new Date().toISOString();
    const imageUrl = IMAGE_URL;

    if (!imageUrl) {
      throw new Error("IMAGE_URL is not set in the .env file.");
    }

    const metadata = {
      amountBurned: amountBurned.toString(),
      date: currentDate,
      image: imageUrl,
    };

    // Encode metadata to hex (required for URI JSON)
    const uriJson = JSON.stringify(metadata);
    const uriHex = Buffer.from(uriJson).toString("hex").toUpperCase();

    // Construct the NFT mint transaction payload
    const payload = {
      TransactionType: "NFTokenMint",
      Account: sender,
      URI: uriHex, 
      Flags: 8, 
      NFTokenTaxon: 0, 
    };

    const response = await xummSdk.payload.create(payload);

    if (!response) {
      throw new Error("Failed to create transaction payload.");
    }

    console.log("Payload created. Sign the transaction using the following URL:");
    console.log(response.next.always);

    return {
      uuid: response.uuid,
      nextUrl: response.next.always,
    };
  } catch (error) {
    console.error("Error in mintNFT:", error.message);
    throw error;
  }
};


module.exports = {mintNFT};