const { network, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")
const { verify } = require("../helper-hardhat-config")
const VRF_SUB_FUND_AMOUNT = ethers.parseEther("2")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId
    let vrfCoordinatorV2address, subscriptionId, vrfCoordinatorV2Mock
    /////////
    /*const accounts = await ethers.getSigners()
    signer = accounts[0]*/
    /////////

    if (developmentChains.includes(network.name)) {
        /*vrfCoordinatorV2Mock = await ethers.getContract(
            //// COSAS RARAS
            "VRFCoordinatorV2Mock",
        )
        vrfCoordinatorV2address = vrfCoordinatorV2Mock.address*/
        //////////////////////////////////////////////
        const vrfCoordinatorV2MockDeploy = await deployments.get("VRFCoordinatorV2Mock") //Guauu!! parece que funciona esto
        //vrfCoordinatorV2address = vrfCoordinatorV2MockDeploy.address
        //vrfCoordinatorV2address = vrfCoordinatorV2Mock.address
        //log(vrfCoordinatorV2MockDeploy)
        /////////////////////////////////////////////
        vrfCoordinatorV2Mock = await ethers.getContractAt(
            vrfCoordinatorV2MockDeploy.abi,
            vrfCoordinatorV2MockDeploy.address,
            //signer,
        )
        //vrfCoordinatorV2address = MockV2Coordinator.address
        /////////////////////////////////////////////

        const transactionResponse = await vrfCoordinatorV2Mock.createSubscription()
        //const transactionResponse = await vrfCoordinatorV2MockDeploy.createSubscription()
        //log(transactionResponse)
        const transactionReceipt = await transactionResponse.wait(1)
        //log(transactionReceipt)

        //subscriptionId = transactionReceipt.events[0].args.requestId
        /*subscriptionId = transactionReceipt.logs[1].args.requestId
         */
        subscriptionId = 1
        log(subscriptionId)

        //We have the subscription, then we need to fund the suscription
        //Usually you need link token  to a real network

        await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, VRF_SUB_FUND_AMOUNT)
        //await vrfCoordinatorV2MockDeploy.fundSubscription(subscriptionId, VRF_SUB_FUND_AMOUNT)
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
        from: deployer,
        //from: signer,
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
