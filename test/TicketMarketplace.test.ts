import { expect } from "chai";
import { ethers } from "hardhat";
import { EventTicketing } from "../typechain-types/contracts/EventTicketing";
import { TicketMarketplace } from "../typechain-types/contracts/TicketMarketplace";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("TicketMarketplace", function () {
  let eventTicketing: EventTicketing;
  let ticketMarketplace: TicketMarketplace;
  let owner: SignerWithAddress;
  let eventManager: SignerWithAddress;
  let validator: SignerWithAddress;
  let seller: SignerWithAddress;
  let buyer: SignerWithAddress;
  
  // Constants for testing
  const EVENT_NAME = "Test Concert";
  const TICKET_PRICE = ethers.parseEther("0.1"); // 0.1 ETH
  const RESALE_PRICE = ethers.parseEther("0.15"); // 0.15 ETH
  const TOTAL_TICKETS = 100;
  const MAX_PER_BUYER = 2;
  const EVENT_ID = 1; // First event ID
  const TICKET_ID = 1; // First ticket ID
  
  // Calculate timestamps for event
  let startTime: number;
  let endTime: number;
  
  beforeEach(async function () {
    // Get current block timestamp
    const currentTime = await time.latest();
    startTime = currentTime + 3600; // Start 1 hour from now
    endTime = startTime + 86400; // End 24 hours after start

    // Get signers
    [owner, eventManager, validator, seller, buyer] = await ethers.getSigners();
    
    // Deploy EventTicketing contract
    const EventTicketingFactory = await ethers.getContractFactory("EventTicketing");
    eventTicketing = await EventTicketingFactory.deploy() as EventTicketing;
    
    // Grant roles
    await eventTicketing.grantEventManagerRole(eventManager.address);
    await eventTicketing.grantTicketValidatorRole(validator.address);
    
    // Create an event
    await eventTicketing.connect(eventManager).createEvent(
      EVENT_NAME,
      TICKET_PRICE,
      TOTAL_TICKETS,
      MAX_PER_BUYER,
      startTime,
      endTime
    );
    
    // Move time to after start time
    await time.increaseTo(startTime + 1);
    
    // Purchase a ticket for the seller
    await eventTicketing.connect(seller).purchaseTicket(EVENT_ID, {
      value: TICKET_PRICE
    });
    
    // Deploy TicketMarketplace contract
    const TicketMarketplaceFactory = await ethers.getContractFactory("TicketMarketplace");
    ticketMarketplace = await TicketMarketplaceFactory.deploy(eventTicketing.target) as TicketMarketplace;
  });
  
  describe("Ticket Listing", function () {
    it("Should allow ticket owner to list a ticket", async function () {
      // Approve marketplace to transfer ticket
      await eventTicketing.connect(seller).approve(ticketMarketplace.target, TICKET_ID);
      
      // List ticket
      await expect(
        ticketMarketplace.connect(seller).listTicket(TICKET_ID, RESALE_PRICE)
      ).to.emit(ticketMarketplace, "TicketListed")
        .withArgs(TICKET_ID, seller.address, RESALE_PRICE);
      
      // Verify listing
      const [listedSeller, listedPrice, active] = await ticketMarketplace.getListing(TICKET_ID);
      expect(listedSeller).to.equal(seller.address);
      expect(listedPrice).to.equal(RESALE_PRICE);
      expect(active).to.be.true;
    });
    
    it("Should enforce max price limit for resale", async function () {
      // Approve marketplace to transfer ticket
      await eventTicketing.connect(seller).approve(ticketMarketplace.target, TICKET_ID);
      
      // Calculate max allowed price (150% of original)
      const maxAllowedPrice = (TICKET_PRICE * 150n) / 100n;
      const tooHighPrice = maxAllowedPrice + ethers.parseEther("0.01");
      
      // Try to list with too high price
      await expect(
        ticketMarketplace.connect(seller).listTicket(TICKET_ID, tooHighPrice)
      ).to.be.revertedWith("Price exceeds maximum allowed");
      
      // List with acceptable price
      await ticketMarketplace.connect(seller).listTicket(TICKET_ID, maxAllowedPrice);
      
      // Verify listing
      const [, listedPrice, ] = await ticketMarketplace.getListing(TICKET_ID);
      expect(listedPrice).to.equal(maxAllowedPrice);
    });
    
    it("Should not allow non-owner to list a ticket", async function () {
      await expect(
        ticketMarketplace.connect(buyer).listTicket(TICKET_ID, RESALE_PRICE)
      ).to.be.revertedWith("Not the ticket owner");
    });
  });
  
  describe("Ticket Purchase", function () {
    beforeEach(async function () {
      // Approve and list ticket before each purchase test
      await eventTicketing.connect(seller).approve(ticketMarketplace.target, TICKET_ID);
      await ticketMarketplace.connect(seller).listTicket(TICKET_ID, RESALE_PRICE);
    });
    
    it("Should allow buying a listed ticket", async function () {
      const sellerInitialBalance = await ethers.provider.getBalance(seller.address);
      const organizerInitialBalance = await ethers.provider.getBalance(owner.address);
      
      // Calculate royalty
      const royaltyAmount = (RESALE_PRICE * 10n) / 100n; // 10% royalty
      const sellerAmount = RESALE_PRICE - royaltyAmount;
      
      // Buy ticket
      await expect(
        ticketMarketplace.connect(buyer).purchaseTicket(TICKET_ID, {
          value: RESALE_PRICE
        })
      ).to.emit(ticketMarketplace, "TicketSold")
        .withArgs(TICKET_ID, seller.address, buyer.address, RESALE_PRICE);
      
      // Verify ticket ownership transferred
      expect(await eventTicketing.ownerOf(TICKET_ID)).to.equal(buyer.address);
      
      // Verify listing is no longer active
      const [, , active] = await ticketMarketplace.getListing(TICKET_ID);
      expect(active).to.be.false;
      
      // Verify seller received payment (approximately)
      const sellerFinalBalance = await ethers.provider.getBalance(seller.address);
      const sellerBalanceDiff = sellerFinalBalance - sellerInitialBalance;
      expect(sellerBalanceDiff).to.be.closeTo(sellerAmount, ethers.parseEther("0.0001"));
      
      // Verify organizer received royalty (approximately)
      const organizerFinalBalance = await ethers.provider.getBalance(owner.address);
      const organizerBalanceDiff = organizerFinalBalance - organizerInitialBalance;
      expect(organizerBalanceDiff).to.be.closeTo(royaltyAmount, ethers.parseEther("0.0001"));
    });
    
    it("Should not allow purchase with insufficient funds", async function () {
      const insufficientAmount = RESALE_PRICE - ethers.parseEther("0.01");
      
      await expect(
        ticketMarketplace.connect(buyer).purchaseTicket(TICKET_ID, {
          value: insufficientAmount
        })
      ).to.be.revertedWith("Insufficient payment");
    });
    
    it("Should refund excess payment", async function () {
      const excessAmount = ethers.parseEther("0.05");
      const totalPayment = RESALE_PRICE + excessAmount;
      
      const initialBalance = await ethers.provider.getBalance(buyer.address);
      
      // Buy ticket with excess payment
      const tx = await ticketMarketplace.connect(buyer).purchaseTicket(TICKET_ID, {
        value: totalPayment
      });
      
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;
      
      const finalBalance = await ethers.provider.getBalance(buyer.address);
      
      // Expected balance: initial - resale price - gas fees
      const expectedBalance = initialBalance - RESALE_PRICE - gasUsed;
      
      // Allow for small rounding errors due to gas calculation
      expect(finalBalance).to.be.closeTo(expectedBalance, ethers.parseEther("0.0001"));
    });
  });
  
  describe("Listing Management", function () {
    beforeEach(async function () {
      // Approve and list ticket
      await eventTicketing.connect(seller).approve(ticketMarketplace.target, TICKET_ID);
      await ticketMarketplace.connect(seller).listTicket(TICKET_ID, RESALE_PRICE);
    });
    
    it("Should allow seller to cancel listing", async function () {
      await expect(
        ticketMarketplace.connect(seller).cancelListing(TICKET_ID)
      ).to.emit(ticketMarketplace, "ListingCanceled")
        .withArgs(TICKET_ID, seller.address);
      
      // Verify listing is no longer active
      const [, , active] = await ticketMarketplace.getListing(TICKET_ID);
      expect(active).to.be.false;
    });
    
    it("Should allow admin to cancel any listing", async function () {
      await expect(
        ticketMarketplace.connect(owner).cancelListing(TICKET_ID)
      ).to.emit(ticketMarketplace, "ListingCanceled")
        .withArgs(TICKET_ID, seller.address);
      
      // Verify listing is no longer active
      const [, , active] = await ticketMarketplace.getListing(TICKET_ID);
      expect(active).to.be.false;
    });
    
    it("Should not allow non-seller/non-admin to cancel listing", async function () {
      await expect(
        ticketMarketplace.connect(buyer).cancelListing(TICKET_ID)
      ).to.be.revertedWith("Not the seller or admin");
    });
  });
  
  describe("Contract Administration", function () {
    it("Should allow admin to update ticket contract", async function () {
      // Deploy a new EventTicketing contract
      const EventTicketingFactory = await ethers.getContractFactory("EventTicketing");
      const newEventTicketing = await EventTicketingFactory.deploy();
      
      // Update ticket contract
      await ticketMarketplace.connect(owner).updateTicketContract(newEventTicketing.target);
      
      // Verify update
      expect(await ticketMarketplace.ticketContract()).to.equal(newEventTicketing.target);
    });
    
    it("Should not allow non-admin to update ticket contract", async function () {
      const EventTicketingFactory = await ethers.getContractFactory("EventTicketing");
      const newEventTicketing = await EventTicketingFactory.deploy();
      
      await expect(
        ticketMarketplace.connect(seller).updateTicketContract(newEventTicketing.target)
      ).to.be.revertedWithCustomError(ticketMarketplace, "AccessControlUnauthorizedAccount");
    });
  });
});