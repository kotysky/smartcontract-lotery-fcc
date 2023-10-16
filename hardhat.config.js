require("@nomicfoundation/hardhat-toolbox")
require("hardhat-deploy")
require("dotenv").config()

require("solidity-coverage")
require("hardhat-gas-reporter")
require("hardhat-contract-sizer")

const RPC_SEPOLIA_URL = process.env.RPC_SEPOLIA_URL
const PRIVATE_KEY = process.env.PRIVATE_KEY
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY
module.exports = {
    defaultNetwork: "hardhat",
    nerworks: {
        hardhat: {
            chainId: 31337,
            blockConfirmations: 1,
        },
        sepolia: {
            chainId: 11155111,
            blockConfirmations: 6,
            url: RPC_SEPOLIA_URL,
            accounts: PRIVATE_KEY,
        },
    },
    solidity: "0.8.19",
    namedAccounts: {
        deployer: {
            default: 0,
        },
        player: {
            default: 1,
        },
    },
}
