const { developmentChains } = require("../helper-hardhat-config")

const { developmentChains } = require("../helper-hardhat-config")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const [deploy, log] = deployments
    const [deployer] = await getNamedAccouts()
    const chainId = network.config.chainId

    if (developmentChains.includes(network.name)) {
        log("Local network detected!, Deploying mocks...")
        await deploy("VRFCoordinatorV2Mock", {
            from: deployer,
            log: true,
            args: [],
        })
    }
}
