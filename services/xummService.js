const { XummSdk } = require('xumm-sdk');
const dotenv = require('dotenv');
dotenv.config();

const xummSdk = new XummSdk(process.env.XUMM_API_KEY, process.env.XUMM_API_SECRET);

module.exports = xummSdk;
