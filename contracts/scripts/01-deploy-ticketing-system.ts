import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, network } = hre;
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  
  log("----------------------------------------------------");
  log("Deploying TicketChain contracts...");
  
  // Define base URI for ticket metadata
  const baseURI = "https://api.ticketchain.io/";
  
  // Deploy EventTicketing contract
  const eventTicketing = await deploy("EventTicketing", {
    from: deployer,
    args: [baseURI],
    log: true,
    waitConfirmations: network.name === "hardhat" ? 1 : 6,
  });
  
  log(`EventTicketing deployed at ${eventTicketing.address}`);
  
  // Deploy TicketMarketplace contract with EventTicketing address
  const ticketMarketplace = await deploy("TicketMarketplace", {
    from: deployer,
    args: [eventTicketing.address],
    log: true,
    waitConfirmations: network.name === "hardhat" ? 1 : 6,
  });
  
  log(`TicketMarketplace deployed at ${ticketMarketplace.address}`);
  
  // Set up roles if we're on a testnet or local network
  if (network.name !== "mainnet") {
    log("Setting up roles for testing...");
    
    const eventTicketingContract = await ethers.getContractAt("EventTicketing", eventTicketing.address);
    
    // Define test accounts
    const accounts = await ethers.getSigners();
    const organizer = accounts[1];
    const validator = accounts[2];
    
    // Set up roles
    const EVENT_ORGANIZER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("EVENT_ORGANIZER_ROLE"));
    const VALIDATOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("VALIDATOR_ROLE"));
    
    // Grant roles
    const tx1 = await eventTicketingContract.grantRole(EVENT_ORGANIZER_ROLE, organizer.address);
    await tx1.wait();
    log(`Granted EVENT_ORGANIZER_ROLE to ${organizer.address}`);
    
    const tx2 = await eventTicketingContract.grantRole(VALIDATOR_ROLE, validator.address);
    await tx2.wait();
    log(`Granted VALIDATOR_ROLE to ${validator.address}`);
  }
  
  log("----------------------------------------------------");
};

func.tags = ["all", "ticketing"];

export default func;