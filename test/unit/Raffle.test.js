const { assert, expect } = require("chai")
const { getNamedAccounts, deployments, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")
const {
    isCallTrace,
} = require("hardhat/internal/hardhat-network/stack-traces/message-trace")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle units tests", async () => {
          let raffle, vrfCoordinatorV2Mock, deployer, raffleDeploy
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
          })
          describe("constructor", async () => {
              it("initializes de raffle correctly...", async () => {
                  // Idealy we make our  test have 1 assert per it

                  const raffleState = await raffle.getRaffleState()
                  const interval = await raffle.getInterval()
                  assert.equal(raffleState.toString(), "0")
                  assert.equal(
                      interval.toString(),
                      networkConfig[network.config.chainId]["interval"],
                  )
              })
          })
          describe("enterRaffle", async () => {
              it("reverts when you dont pay enough", async () => {
                  await expect(raffle.enterRaffle()).to.be.revertedWith(
                      "Raffle__SendMoreToEnterRaffle",
                  )
              })
          })
      })
