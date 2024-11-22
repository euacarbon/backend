const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  port: process.env.PORT,
  xrpNodeUrl: process.env.XRP_NODE_URL,
  adminAddress: process.env.ADMIN_ADDRESS,
  adminSecret: process.env.ADMIN_SECRET,
  XUMM_API_KEY: process.env.XUMM_API_KEY,
  XUMM_API_SECRET: process.env.XUMM_API_SECRET,
  // Add other configurations as needed
};
