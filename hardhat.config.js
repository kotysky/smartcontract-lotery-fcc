require("@nomicfoundation/hardhat-toolbox")
require("hardhat-deploy")
require("dotenv").config()
require("solidity-coverage")
require("hardhat-gas-reporter")
require("hardhat-contract-sizer")

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: "0.8.19",
}
