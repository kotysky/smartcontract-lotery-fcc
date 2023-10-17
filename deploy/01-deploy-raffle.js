const { network, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")
const { verify } = require("../helper-hardhat-config")
const VRF_SUB_FUND_AMOUNT = ethers.parseEther("2")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId
    let vrfCoordinatorV2address, subscriptionId
    /////////
    const accounts = await ethers.getSigners()
    signer = accounts[0]
    /////////

    if (developmentChains.includes(network.name)) {
        /*const vrfCoordinatorV2Mock = await ethers.getContractAt(
            //// COSAS RARAS
            "VRFCoordinatorV2Mock",
        )*/
        //const vrfCoordinatorV2Mock = await deployments.get("VRFCoordinatorV2Mock") //Guauu!! parece que funciona esto
        const vrfCoordinatorV2Mock = await deployments.get("VRFCoordinatorV2Mock")
        MockV2Coordinator = await ethers.getContractAt(
            vrfCoordinatorV2Mock.abi,
            vrfCoordinatorV2Mock.address,
            signer,
        )
        //////////////////////////

        vrfCoordinatorV2address = MockV2Coordinator.address

        const transactionResponse = await MockV2Coordinator.createSubscription()
        const transactionReceipt = await transactionResponse.wait()
        //subscriptionId = transactionReceipt.events[0].args.requestId
        subscriptionId = 1
        //We have the subscription, then we need to fund the suscription
        //Usually you need link token  to a real network

        await MockV2Coordinator.fundSubscription(subscriptionId, VRF_SUB_FUND_AMOUNT)
    } else {
        vrfCoordinatorV2address = networkConfig[chainId]["vrfCoodinatorV2"]
        subscriptionId = networkConfig[chainId]["subscriptionId"]
    }

    const entranceFee = networkConfig[chainId]["entranceFee"]
    const gasLane = networkConfig[chainId]["gasLane"]
    const callbackGasLimit = networkConfig[chainId]["callbackGasLimit"]
    const interval = networkConfig[chainId]["interval"]

    const args = [
        vrfCoordinatorV2address,
        entranceFee,
        gasLane,
        subscriptionId,
        callbackGasLimit,
        interval,
    ]

    const raffle = await deploy("Raffle", {
        //from: deployer,
        from: signer,
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
