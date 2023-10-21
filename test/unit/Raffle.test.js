const { assert, expect } = require("chai")
const { getNamedAccounts, deployments, ethers, network } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")
const { isCallTrace } = require("hardhat/internal/hardhat-network/stack-traces/message-trace")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle units tests", async () => {
          let raffle, vrfCoordinatorV2Mock, deployer, raffleDeploy, raffleEntranceFee, interval
          const chainId = networkConfig.chainId
          beforeEach(async () => {
              deployer = (await getNamedAccounts()).deployer

              await deployments.fixture(["all"])
              raffleDeploy = await deployments.get("Raffle")
              raffle = await ethers.getContractAt(raffleDeploy.abi, raffleDeploy.address)
              const vrfCoordinatorV2MockDeploy = await deployments.get("VRFCoordinatorV2Mock")
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
                  /*await expect(raffle.enterRaffle()).to.be.revertedWith("Raffle__SendMoreToEnterRaffle") // Error Ethers 5*/
                  await expect(raffle.enterRaffle()).to.be.revertedWithCustomError(
                      raffle,
                      "Raffle__SendMoreToEnterRaffle",
                  ) // Ether 6 works!!*/
              })
              it("records players when they enters", async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  const playerFromContract = await raffle.getPlayer(0)
                  assert.equal(playerFromContract, deployer)
              })
              it("emits event on enter", async () => {
                  await expect(raffle.enterRaffle({ value: raffleEntranceFee })).to.emit(
                      raffle,
                      "RaffleEnter",
                  )
              })
              it("doesnt allow entrance when raffle is calculating", async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [Number(interval) + 1])

                  await network.provider.request({ method: "evm_mine", params: [] })

                  await raffle.performUpkeep("0x")
                  //console.log("hi!")
                  /*await expect(
                      raffle.enterRaffle({ value: raffleEntranceFee }),
                  ).to.be.revertedWith("Raffle__RaffleNotOpenn")// Error Ethers 5*/
                  await expect(
                      raffle.enterRaffle({ value: raffleEntranceFee }),
                  ).to.be.revertedWithCustomError(raffle, "Raffle__RaffleNotOpen") // Ether 6 works!!
              })
          })
          describe("checkUpkeep", () => {
              it("returns false if people haven´t send any ETH", async () => {
                  await network.provider.send("evm_increaseTime", [Number(interval) + 1])
                  await network.provider.send("evm_mine", [])
                  //await raffle.checkUpkeep("0x")
                  //const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x")//Error Ethers 5
                  const { upkeepNeeded } = await raffle.checkUpkeep.staticCall("0x") // Ethers 6
                  assert(!upkeepNeeded)
              })
              it("returns false if raffle isn´t open", async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [Number(interval) + 1])
                  await network.provider.send("evm_mine", [])
                  await raffle.performUpkeep("0x")
                  const raffleState = await raffle.getRaffleState()
                  const { upkeepNeeded } = await raffle.checkUpkeep.staticCall("0x") //Ethers 6
                  assert.equal(raffleState.toString(), "1")
                  assert.equal(upkeepNeeded, false)
              })
              it("returns false if enough time hasn't passed", async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [Number(interval) - 5]) // use a higher number here if this test fails
                  await network.provider.request({ method: "evm_mine", params: [] })
                  const { upkeepNeeded } = await raffle.checkUpkeep.staticCall("0x") // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
                  assert(!upkeepNeeded)
              })
              it("returns true if enough time has passed, has players, eth, and is open", async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [Number(interval) + 1])
                  await network.provider.request({ method: "evm_mine", params: [] })
                  const { upkeepNeeded } = await raffle.checkUpkeep.staticCall("0x") // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
                  assert(upkeepNeeded)
              })
          })
          describe("performUpkeep", () => {
              it("it can only run if checkUpkeep is true", async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [Number(interval) + 1])
                  await network.provider.send("evm_mine", [])
                  const tx = await raffle.performUpkeep("0x")
                  assert(tx)
              })
              it("reverts when checkUpkeep is false", async () => {
                  /*await expect(raffle.performUpkeep("0x")).to.be.revertedWith(
                      "Raffle__UpkeepNotNeeded",
                  ) Error ether 5*/
                  await expect(raffle.performUpkeep("0x")).to.be.revertedWithCustomError(
                      raffle,
                      "Raffle__UpkeepNotNeeded",
                  ) // Ether 6 works!!
              })
              it("updates the raffle state,emits and event, and calls the vrf coodinator", async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [Number(interval) + 1])
                  await network.provider.send("evm_mine", [])
                  const txResponse = await raffle.performUpkeep("0x")
                  const txReceipt = await txResponse.wait(1)
                  //const requestId = txReceipt.events[1].args.requestId// Error Ether 5

                  //console.log("transaction events", txReceipt.logs) // Ether 6 works

                  ///// Events  Ethers 6 works /////////////////////////////////////////////////////////////
                  const filter = raffle.filters.RequestedRaffleWinner
                  const events = await raffle.queryFilter(filter, -1)
                  const event = events[0]
                  //console.log(event, "\n-----------------------------")
                  const args = event.args
                  //console.log(args, "\n---------------------------------")
                  expect(event.fragment.name).to.equal("RequestedRaffleWinner")
                  ///////////////////////////////////////////////////////////////////////////////////////////
                  const raffleState = await raffle.getRaffleState()

                  // Ethers 6 work
                  assert(Number(args.requestId) > 0)
                  assert(raffleState.toString() == "1")
              })
          })
          describe("fulfillRandomWords", () => {
              beforeEach(async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [Number(interval) + 1])
                  await network.provider.send("evm_mine", [])
              })
              it("can only be called after performUpkeep", async () => {
                  await expect(
                      //vrfCoordinatorV2Mock.fulfillRandomWords(0, raffle.address()),// Error Ethers 5
                      vrfCoordinatorV2Mock.fulfillRandomWords(0, raffle.getAddress()), // Ethers 6 work
                  ).to.be.revertedWith("nonexistent request")
                  await expect(
                      vrfCoordinatorV2Mock.fulfillRandomWords(1, raffle.getAddress()), // Ethers 6 work
                  ).to.be.revertedWith("nonexistent request")
              })
              it("picks a winner, resets the lotery, and sends money", async () => {
                  const additionalEntrants = 3
                  const startingAccountIndex = 1 // deployer= 0
                  const accounts = await ethers.getSigners()

                  for (
                      let i = startingAccountIndex;
                      i < startingAccountIndex + additionalEntrants;
                      i++
                  ) {
                      const accountConnectedRaffle = raffle.connect(accounts[i])
                      await accountConnectedRaffle.enterRaffle({ value: raffleEntranceFee })
                  }

                  const startingTimeStamp = await raffle.getLatestTimeStamp()

                  await new Promise(async (resolve, reject) => {
                      raffle.once("WinnerPicked", async () => {
                          console.log("Found the events!")
                          const recentWinner = await raffle.getRecentWinner()
                          try {
                              /*console.log(recentWinner)
                              console.log(accounts[2].address)
                              console.log(accounts[0].address)
                              console.log(accounts[1].address)
                              console.log(accounts[3].address)*/
                              const raffleState = await raffle.getRaffleState()
                              const endingTimeStamp = await raffle.getLatestTimeStamp()
                              const numPlayers = await raffle.getNumberOfPlayers()

                              // Error Ethers 5
                              //const winnerEndingBalance = await accounts[1].getBalance()

                              // Ethers 6 work
                              const winnerEndingBalance =
                                  await ethers.provider.getBalance(recentWinner)

                              assert.equal(numPlayers.toString(), "0")
                              assert.equal(raffleState.toString(), "0")

                              assert(endingTimeStamp > startingTimeStamp) /////////////

                              //////////////// Ether 6 work: explicit conversion BigInt //////////////
                              const winnerFinalBalanceArgToAssert =
                                  winnerStartingBalance +
                                  raffleEntranceFee * BigInt(additionalEntrants) +
                                  raffleEntranceFee
                              ////////////////////////////////////////////////////////

                              //////////     Error Ethers 5   //////////
                              /*winnerStartingBalance.add(
                                      raffleEntranceFee
                                          .mul(additionalEntrants)
                                          .add(raffleEntranceFee)
                                          .toString(),
                                  ),*/
                              //////////////////////////////////////////

                              assert(
                                  winnerEndingBalance.toString(),
                                  winnerFinalBalanceArgToAssert.toString(),
                              )

                              resolve()
                          } catch (e) {
                              console.log(e)
                              reject()
                          }
                      })
                      //
                      const tx = await raffle.performUpkeep("0x")
                      //const txReceipt = await tx.wait(1)// no necesario pero correcto

                      // Error Ethers 5
                      // const winnerStartingBalance = await accounts[1].getBalance()

                      // Ethers 6 work
                      const winnerStartingBalance = await ethers.provider.getBalance(accounts[1])

                      // Ether 6 works
                      //console.log("transaction events", txReceipt.logs)

                      ////////////////////////////////////////////////////////////
                      //                Ethers 6 work            /////////////////
                      const filter = raffle.filters.RequestedRaffleWinner
                      const events = await raffle.queryFilter(filter, -1)
                      const args = events[0].args
                      await vrfCoordinatorV2Mock.fulfillRandomWords(
                          args.requestId,
                          raffle.getAddress(),
                      )
                      /////////////////////////////////////////////////////////////
                  })
              })
          })
      })
