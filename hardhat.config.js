require("@nomiclabs/hardhat-waffle");
require('./index');

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  networks: {
    hardhat: {
    },
  },
  solidity: "0.8.4",
  etherscan: {
    apiKey: {
      rinkeby: process.env.ETHERSCAN_API_KEY || '',
    },
  },
};
