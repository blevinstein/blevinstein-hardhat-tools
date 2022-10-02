require("@nomiclabs/hardhat-waffle");
require('./index');

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  networks: {
    hardhat: {
    },
    localhost: {
      url: "http://127.0.0.1:7545",
    },
  },
  solidity: "0.8.4",
  etherscan: {
    apiKey: {
      rinkeby: process.env.ETHERSCAN_API_KEY || '',
    },
  },
};
