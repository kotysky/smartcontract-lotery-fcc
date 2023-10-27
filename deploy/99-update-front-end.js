const { ethers, deployments, network } = require("hardhat")
const fs = require("fs")

const FRONT_END_ADDRESSES_FILE =
    "../next-smartcontract-lottery-fcc/constants/contractAddresses.json"
const FRONT_END_ABI_FILE = "../next-smartcontract-lottery-fcc/constants/abi.json"
const chainId = network.config.chainId

module.exports = async function () {
    if (process.env.UPDATE_FRONT_END) {
        console.log("Updating front end")
        console.log("--------------------------------------------------------------")
        updateContractAddresses()
        updateAbi()
        console.log("Front end written!")
        console.log("--------------------------------------------------------------")
    }
}

async function updateAbi() {
    const raffleDeploy = await deployments.get("Raffle")

    console.log(raffleDeploy.abi)
    console.log("--------------------------------------------------------------")
    console.log("Address:\n", raffleDeploy.address)
    console.log("--------------------------------------------------------------")
    const raffle = await ethers.getContractAt(raffleDeploy.abi, raffleDeploy.address)
    //////////////// Error ethers 5 ///////////////////////////////////////////////
    //fs.writeFileSync(FRONT_END_ABI_FILE, raffle.interface.format(ethers.FormatTypes.json))
    /////////////////////////////////////////////////////////////////////////////

    //////////////   Ether 6 works ///////////////////////////////////////////
    //fs.writeFileSync(FRONT_END_ABI_FILE, JSON.stringify(raffle.interface.format("json")))
    /////////////////////////////////////////////////////////////////////
    //fs.writeFileSync(FRONT_END_ABI_FILE, JSON.stringify(raffleDeploy.abi))
    fs.writeFileSync(FRONT_END_ABI_FILE, JSON.stringify(raffle.interface.formatJson()))
}

async function updateContractAddresses() {
    //const raffle = await ethers.getContract("Raffle")

    const raffleDeploy = await deployments.get("Raffle")
    const raffle = await ethers.getContractAt(raffleDeploy.abi, raffleDeploy.address)

    const currentAddresses = JSON.parse(fs.readFileSync(FRONT_END_ADDRESSES_FILE, "utf8"))
    const chainId = network.config.chainId.toString()
    const raffleAddress = await raffle.getAddress()
    // console.log("RaffleAddress before:", raffleAddress)
    console.log("ChainId: ", chainId)
    //console.log(chainId in currentAddresses)
    //console.log("currentAddress before:", currentAddresses[chainId])
    //console.log("Iguales?:", raffleAddress == currentAddresses[chainId])

    if (chainId in currentAddresses) {
        if (!(currentAddresses[chainId] != raffleAddress)) {
            //currentAddresses[chainId].push(raffle.address)  Error ethers 5

            console.log("RaffleAddress 1", raffleAddress)
            currentAddresses[chainId] = [raffleAddress]
        }
    } else {
        console.log("RaffleAddress 2", raffleAddress)
        currentAddresses[chainId] = [raffleAddress]
    }
    console.log("currentAddress:", currentAddresses[chainId])
    fs.writeFileSync(FRONT_END_ADDRESSES_FILE, JSON.stringify(currentAddresses))
}
module.exports.tags = ["all", "frontend"]
