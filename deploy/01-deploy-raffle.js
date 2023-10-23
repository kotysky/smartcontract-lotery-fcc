const { network, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")
const VRF_SUB_FUND_AMOUNT = ethers.parseEther("2")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId
    let vrfCoordinatorV2address, subscriptionId, vrfCoordinatorV2Mock

    if (developmentChains.includes(network.name)) {
        const vrfCoordinatorV2MockDeploy = await deployments.get("VRFCoordinatorV2Mock") //Guauu!! parece que funciona esto
        vrfCoordinatorV2address = vrfCoordinatorV2MockDeploy.address /// Tu puta madreee!!!

        vrfCoordinatorV2Mock = await ethers.getContractAt(
            vrfCoordinatorV2MockDeploy.abi,
            vrfCoordinatorV2MockDeploy.address,
        )

        const transactionResponse = await vrfCoordinatorV2Mock.createSubscription()
        const transactionReceipt = await transactionResponse.wait(1)

        //subscriptionId = transactionReceipt.events[0].args.subId // Error Ethers 5
        //subscriptionId = transactionReceipt.logs[1].args.requestId

        ////////////////////////////////
        //             Ethers 6 work
        const filter = vrfCoordinatorV2Mock.filters.SubscriptionCreated
        const events = await vrfCoordinatorV2Mock.queryFilter(filter, -1)
        const event = events[0]
        const args = event.args
        subscriptionId = args.subId
        //console.log("-----------------\n", Number(subscriptionId))
        ///////////////////////////////
        const name = networkConfig[chainId]["name"]
        console.log("Name: ", name)
        await vrfCoordinatorV2Mock.fundSubscription(Number(subscriptionId), VRF_SUB_FUND_AMOUNT)
    } else {
        /*const name = networkConfig[chainId]["name"]
        console.log("Name: ", name)*/
        console.log("ChainId:", chainId)
        vrfCoordinatorV2address = networkConfig[chainId]["vrfCoordinatorV2"]
        console.log("Address:", vrfCoordinatorV2address)
        subscriptionId = networkConfig[chainId]["subscriptionId"]
        console.log(vrfCoordinatorV2address, "----", subscriptionId)
    }
    const name = networkConfig[chainId]["name"]
    console.log("Name: ", name)
    const entranceFee = networkConfig[chainId]["entranceFee"]
    const gasLane = networkConfig[chainId]["gasLane"]
    const callbackGasLimit = networkConfig[chainId]["callbackGasLimit"]
    const interval = networkConfig[chainId]["interval"]
    console.log(entranceFee, "    ", callbackGasLimit, "   ", callbackGasLimit, "   ", interval)

    const arguments = [
        vrfCoordinatorV2address,
        subscriptionId,
        gasLane,
        interval,
        entranceFee,
        callbackGasLimit,
    ]

    const raffle = await deploy("Raffle", {
        from: deployer,
        args: arguments,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying!...")
        await verify(raffle.address, arguments)
    }
    //await vrfCoordinatorV2Mock.addConsumer(subscriptionId, raffle.address) //Error en los tests si no se añade esto!!!
    log("---------------------------------------------------------")
}

module.exports.tags = ["all", "raffle"]
