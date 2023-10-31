const { ethers, network } = require("hardhat")

async function mockKeepers() {
    //const raffle = await ethers.getContract("Raffle") // Error ethers 5
    raffleDeploy = await deployments.get("Raffle")
    raffle = await ethers.getContractAt(raffleDeploy.abi, raffleDeploy.address)

    //const checkData = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("")) // Error ethers 5
    const checkData = ethers.keccak256(ethers.toUtf8Bytes(""))
    console.log("checkData: ", checkData)
    // const { upkeepNeeded } = await raffle.callStatic.checkUpkeep(checkData) // Error ethers 5
    const { upkeepNeeded } = await raffle.checkUpkeep(checkData)
    console.log("upkeepNeeded: ", upkeepNeeded)
    if (upkeepNeeded) {
        const tx = await raffle.performUpkeep(checkData)
        console.log("hola")
        const txReceipt = await tx.wait(1)
        const requestId = txReceipt.events[1].args.requestId
        console.log(`Performed upkeep with RequestId: ${requestId}`)
        if (network.config.chainId == 31337) {
            await mockVrf(requestId, raffle)
        }
    } else {
        console.log("No upkeep needed!")
    }
}

async function mockVrf(requestId, raffle) {
    console.log("We on a local network? Ok let's pretend...")
    const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
    await vrfCoordinatorV2Mock.fulfillRandomWords(requestId, raffle.address)
    console.log("Responded!")
    const recentWinner = await raffle.getRecentWinner()
    console.log(`The winner is: ${recentWinner}`)
}

mockKeepers()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
