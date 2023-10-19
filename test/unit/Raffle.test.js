const { assert, expect } = require("chai")
const { getNamedAccounts, deployments, ethers, network } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")
const {
    isCallTrace,
} = require("hardhat/internal/hardhat-network/stack-traces/message-trace")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle units tests", async () => {
          let raffle,
              vrfCoordinatorV2Mock,
              deployer,
              raffleDeploy,
              raffleEntranceFee,
              interval
          const chainId = networkConfig.chainId
          beforeEach(async () => {
              deployer = (await getNamedAccounts()).deployer

              await deployments.fixture(["all"])
              raffleDeploy = await deployments.get("Raffle")
              raffle = await ethers.getContractAt(
                  raffleDeploy.abi,
                  raffleDeploy.address,
              )
              const vrfCoordinatorV2MockDeploy = await deployments.get(
                  "VRFCoordinatorV2Mock",
              )
              vrfCoordinatorV2Mock = await ethers.getContractAt(
                  vrfCoordinatorV2MockDeploy.abi,
                  vrfCoordinatorV2MockDeploy.address,
              )
              raffleEntranceFee = await raffle.getEntranceFee()
              interval = await raffle.getInterval()
          })
          describe("constructor", () => {
              it("initializes de raffle correctly...", async () => {
                  // Idealy we make our  test have 1 assert per it

                  const raffleState = await raffle.getRaffleState()

                  assert.equal(raffleState.toString(), "0")
                  assert.equal(
                      interval.toString(),
                      networkConfig[network.config.chainId]["interval"],
                  )
              })
          })
          describe("enterRaffle", () => {
              it("reverts when you dont pay enough", async () => {
                  expect(raffle.enterRaffle()).to.be.revertedWith(
                      "Raffle__SendMoreToEnterRaffle",
                  )
              })
              it("records players when they enters", async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  const playerFromContract = await raffle.getPlayer(0)
                  assert.equal(playerFromContract, deployer)
              })
              it("emits event on enter", async () => {
                  await expect(
                      raffle.enterRaffle({ value: raffleEntranceFee }),
                  ).to.emit(raffle, "RaffleEnter")
              })
              it("doesnt allow entrance when raffle is calculating", async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [
                      Number(interval) + 1,
                  ])

                  await network.provider.request({ method: "evm_mine", params: [] })

                  await raffle.performUpkeep("0x")
                  //console.log("hi!")
                  expect(
                      raffle.enterRaffle({ value: raffleEntranceFee }),
                  ).to.be.revertedWith("Raffle__RaffleNotOpenn")
              })
          })
          describe("checkUpkeep", () => {
              it("returns false if people haven´t send any ETH", async () => {
                  await network.provider.send("evm_increaseTime", [
                      Number(interval) + 1,
                  ])
                  await network.provider.send("evm_mine", [])
                  //await raffle.checkUpkeep("0x")
                  //const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x")//Error Ethers 5
                  const { upkeepNeeded } = await raffle.checkUpkeep.staticCall("0x") // Ethers 6
                  assert(!upkeepNeeded)
              })
              it("returns false if raffle isn´t open", async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [
                      Number(interval) + 1,
                  ])
                  await network.provider.send("evm_mine", [])
                  await raffle.performUpkeep("0x")
                  const raffleState = await raffle.getRaffleState()
                  const { upkeepNeeded } = await raffle.checkUpkeep.staticCall("0x") //Ethers 6
                  assert.equal(raffleState.toString(), "1")
                  assert.equal(upkeepNeeded, false)
              })
              it("returns false if enough time hasn't passed", async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [
                      Number(interval) - 5,
                  ]) // use a higher number here if this test fails
                  await network.provider.request({ method: "evm_mine", params: [] })
                  const { upkeepNeeded } = await raffle.checkUpkeep.staticCall("0x") // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
                  assert(!upkeepNeeded)
              })
              it("returns true if enough time has passed, has players, eth, and is open", async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [
                      Number(interval) + 1,
                  ])
                  await network.provider.request({ method: "evm_mine", params: [] })
                  const { upkeepNeeded } = await raffle.checkUpkeep.staticCall("0x") // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
                  assert(upkeepNeeded)
              })
          })
          describe("performUpkeep", () => {
              it("it can only run if checkUpkeep is true", async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [
                      Number(interval) + 1,
                  ])
                  await network.provider.send("evm_mine", [])
                  const tx = await raffle.performUpkeep("0x")
                  assert(tx)
              })
          })
      })
