const { assert } = require("chai")
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
              console.log(raffleDeploy)
              console.log(raffle)

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
                  console.log(interval)
                  assert.equal(raffleState.toString(), "0")
                  assert.equal(
                      interval.toString(),
                      networkConfig[network.config.chainId]["interval"],
                  )
              })
          })
      })
