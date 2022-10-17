import "@nomicfoundation/hardhat-toolbox";
import "hardhat-contract-sizer";
import "hardhat-deploy";
import "dotenv/config";
import { HardhatUserConfig } from "hardhat/types";
import "hardhat-deploy";
import "@nomiclabs/hardhat-ethers";
import "hardhat-gas-reporter";
import "@typechain/hardhat";
import "solidity-coverage";
import "@typechain/hardhat";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-etherscan";
import "hardhat-tracer";

const defaultKey =
  "0000000000000000000000000000000000000000000000000000000000000001";
const defaultRpcUrl = "https://localhost:8545";
const defaultEtherBalance = "100000000";

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.3",
        settings: {
          optimizer: {
            enabled: false,
            runs: 200
          }
        }
      }
    ]
  },
  networks: {
    hardhat: {
      chainId: 31337,
      // forking: {
      //   url: process.env.MAINNET_URL || "",
      //   blockNumber: Number(process.env.BLOCK_NUMBER) || 14452169,
      // },
    },
    // mumbai: {
    //   url: process.env.MUMBAI_URL || defaultRpcUrl,
    //   accounts: [process.env.PRIVATE_KEY || defaultKey],
    // }
    goerli: {
      url: process.env.GOERLI_URL || "",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    // mainnet : {
    //   url: process.env.MAINNET_URL || "",
    //   accounts: 
    //   process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    // }
  },
  namedAccounts: {
    deployer: 0,
    alice: 1,
    bob: 2,
    carol: 3,
    ted: 4,
  },
  // gasReporter: {
  //   enabled: process.env.REPORT_GAS ? true : undefined,
  //   currency: "AUD",
  //   coinmarketcap: process.env.COINMARKETCAP_KEY || "",
  // },
  // etherscan: {
  //   apiKey: process.env.ETHERSCAN_API_KEY,
  // },
};

export default config;
