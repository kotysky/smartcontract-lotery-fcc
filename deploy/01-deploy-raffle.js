const { network, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")
const { verify } = require("../helper-hardhat-config")
const VRF_SUB_FUND_AMOUNT = ethers.parseEther("2")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId
    let vrfCoordinatorV2address, subscriptionId

    if (developmentChains.includes(network.name)) {
        const vrfCoordinatorV2Mock = await ethers.getContract(
            //// COSAS RARAS
            "VRFCoordinatorV2Mock",
        )
        vrfCoordinatorV2address = vrfCoordinatorV2Mock.address
        const transactionResponse = await vrfCoordinatorV2Mock.createSubscription()
        const transactionRecipt = await transactionResponse.wait(1)
        subscriptionId = transactionRecipt.event[0].args.subId
        //We have the subscription, then we need to fund the suscription
        //Usually you need link token  to a real network
        await vrfCoordinatorV2Mock.fundSubcription(subscriptionId, VRF_SUB_FUND_AMOUNT)
    } else {
        vrfCoordinatorV2address = netwotkConfig[chainId]["vrfCoodinatorV2"]
        subscriptionId = networkConfig[chainId]["subscriptionId"]
    }
    const entranceFee = networkConfig[chainId]["entranceFee"]
    const gasLane = networkConfig[chanId]["gasLane"]
    const callbackGasLimit = networkConfig[chainId]["callbackGasLimit"]
    const interval = networkConfig[chainId][interval]

    const args = [
        vrfCoordinatorV2address,
        entranceFee,
        gasLane,
        subscriptionId,
        callbackGasLimit,
        interval,
    ]
    const raffle = await deploy("Raffle", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying!...")
        await verify(raffle.address, args)
    }
    log("---------------------------------------------------------")
}

module.exports.tags = ["all", "raffle"]
