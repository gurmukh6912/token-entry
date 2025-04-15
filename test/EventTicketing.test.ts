import { expect } from "chai";
import { ethers } from "hardhat";
import { EventTicketing } from "../typechain-types/contracts/EventTicketing";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("EventTicketing", function () {
  let eventTicketing: EventTicketing;
  let owner: SignerWithAddress;
  let eventManager: SignerWithAddress;
  let validator: SignerWithAddress;
  let buyer1: SignerWithAddress;
  let buyer2: SignerWithAddress;
  
  // Constants for testing
  const EVENT_NAME = "Test Concert";
  const TICKET_PRICE = ethers.parseEther("0.1"); // 0.1 ETH
  const TOTAL_TICKETS = 100;
  const MAX_PER_BUYER = 2;
  const EVENT_ID = 1; // First event ID

  // Calculate timestamps for event
  let startTime: number;
  let endTime: number;
  
  beforeEach(async function () {
    // Get current block timestamp
    const currentTime = await time.latest();
    startTime = currentTime + 3600; // Start 1 hour from now
    endTime = startTime + 86400; // End 24 hours after start

    // Get signers
    [owner, eventManager, validator, buyer1, buyer2] = await ethers.getSigners();
    
    // Deploy contract
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
  });
  
  describe("Event Creation", function () {
    it("Should create an event with correct parameters", async function () {
      const [name, price, ticketCount, active] = await eventTicketing.getBasicEventDetails(EVENT_ID);
      
      expect(name).to.equal(EVENT_NAME);
      expect(price).to.equal(TICKET_PRICE);
      expect(ticketCount).to.equal(TOTAL_TICKETS);
      expect(active).to.be.true;
      
      const [maxTicketsPerBuyer, eventStartTime, eventEndTime, ticketsSold] = 
        await eventTicketing.getEventTimeDetails(EVENT_ID);
      
      expect(maxTicketsPerBuyer).to.equal(MAX_PER_BUYER);
      expect(eventStartTime).to.equal(startTime);
      expect(eventEndTime).to.equal(endTime);
      expect(ticketsSold).to.equal(0);
    });
    
    it("Should revert when non-event manager tries to create an event", async function () {
      await expect(
        eventTicketing.connect(buyer1).createEvent(
          "Unauthorized Event",
          TICKET_PRICE,
          TOTAL_TICKETS,
          MAX_PER_BUYER,
          startTime,
          endTime
        )
      ).to.be.revertedWithCustomError(eventTicketing, "AccessControlUnauthorizedAccount");
    });
  });
  
  describe("Ticket Purchase", function () {
    it("Should allow purchasing a ticket", async function () {
      // Move time to after start time
      await time.increaseTo(startTime + 1);
      
      await expect(
        eventTicketing.connect(buyer1).purchaseTicket(EVENT_ID, {
          value: TICKET_PRICE
        })
      ).to.emit(eventTicketing, "TicketMinted")
        .withArgs(1, EVENT_ID, buyer1.address);
      
      // Check ticket details
      const [eventId, purchasePrice, used] = await eventTicketing.getTicketDetails(1);
      expect(eventId).to.equal(EVENT_ID);
      expect(purchasePrice).to.equal(TICKET_PRICE);
      expect(used).to.be.false;
      
      // Check ticket owner
      expect(await eventTicketing.ownerOf(1)).to.equal(buyer1.address);
    });
    
    it("Should not allow exceeding max tickets per buyer", async function () {
      // Move time to after start time
      await time.increaseTo(startTime + 1);
      
      // Buy max allowed tickets
      for (let i = 0; i < MAX_PER_BUYER; i++) {
        await eventTicketing.connect(buyer1).purchaseTicket(EVENT_ID, {
          value: TICKET_PRICE
        });
      }
      
      // Try to buy one more
      await expect(
        eventTicketing.connect(buyer1).purchaseTicket(EVENT_ID, {
          value: TICKET_PRICE
        })
      ).to.be.revertedWith("Exceeded max tickets per buyer");
    });
    
    it("Should refund excess payment", async function () {
      // Move time to after start time
      await time.increaseTo(startTime + 1);
      
      const excessAmount = ethers.parseEther("0.05");
      const totalPayment = TICKET_PRICE + excessAmount;
      
      const initialBalance = await ethers.provider.getBalance(buyer1.address);
      
      // Buy ticket with excess payment
      const tx = await eventTicketing.connect(buyer1).purchaseTicket(EVENT_ID, {
        value: totalPayment
      });
      
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;
      
      const finalBalance = await ethers.provider.getBalance(buyer1.address);
      
      // Expected balance: initial - ticket price - gas fees
      const expectedBalance = initialBalance - TICKET_PRICE - gasUsed;
      
      // Allow for small rounding errors due to gas calculation
      expect(finalBalance).to.be.closeTo(expectedBalance, ethers.parseEther("0.0001"));
    });
  });
  
  describe("Ticket Validation", function () {
    it("Should allow validator to mark ticket as used", async function () {
      // Move time to after start time
      await time.increaseTo(startTime + 1);
      
      // Buy a ticket
      await eventTicketing.connect(buyer1).purchaseTicket(EVENT_ID, {
        value: TICKET_PRICE
      });
      
      // Validate the ticket
      await expect(
        eventTicketing.connect(validator).useTicket(1)
      ).to.emit(eventTicketing, "TicketUsed")
        .withArgs(1, EVENT_ID);
      
      // Check ticket is marked as used
      const [, , used] = await eventTicketing.getTicketDetails(1);
      expect(used).to.be.true;
      
      // Check ticket validity
      expect(await eventTicketing.isTicketValid(1)).to.be.false;
    });
    
    it("Should not allow non-validator to mark ticket as used", async function () {
      // Move time to after start time
      await time.increaseTo(startTime + 1);
      
      // Buy a ticket
      await eventTicketing.connect(buyer1).purchaseTicket(EVENT_ID, {
        value: TICKET_PRICE
      });
      
      // Try to validate with non-validator account
      await expect(
        eventTicketing.connect(buyer2).useTicket(1)
      ).to.be.revertedWithCustomError(eventTicketing, "AccessControlUnauthorizedAccount");
    });
  });
  
  describe("Event Management", function () {
    it("Should allow event manager to deactivate an event", async function () {
      await eventTicketing.connect(eventManager).setEventStatus(EVENT_ID, false);
      
      const [, , , active] = await eventTicketing.getBasicEventDetails(EVENT_ID);
      expect(active).to.be.false;
    });
    
    it("Should check ticket validity based on event status", async function () {
      // Move time to after start time
      await time.increaseTo(startTime + 1);
      
      // Buy a ticket
      await eventTicketing.connect(buyer1).purchaseTicket(EVENT_ID, {
        value: TICKET_PRICE
      });
      
      // Deactivate the event
      await eventTicketing.connect(eventManager).setEventStatus(EVENT_ID, false);
      
      // Check ticket validity
      expect(await eventTicketing.isTicketValid(1)).to.be.false;
    });
  });
  
  describe("Contract Administration", function () {
    it("Should allow admin to withdraw funds", async function () {
      // Move time to after start time
      await time.increaseTo(startTime + 1);
      
      // Buy several tickets to add funds to contract
      await eventTicketing.connect(buyer1).purchaseTicket(EVENT_ID, { value: TICKET_PRICE });
      await eventTicketing.connect(buyer2).purchaseTicket(EVENT_ID, { value: TICKET_PRICE });
      
      const initialBalance = await ethers.provider.getBalance(owner.address);
      const contractBalance = TICKET_PRICE * 2n;
      
      // Withdraw funds
      const tx = await eventTicketing.connect(owner).withdraw();
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;
      
      const finalBalance = await ethers.provider.getBalance(owner.address);
      
      // Expected balance: initial + contract balance - gas fees
      const expectedBalance = initialBalance + contractBalance - gasUsed;
      
      // Allow for small rounding errors due to gas calculation
      expect(finalBalance).to.be.closeTo(expectedBalance, ethers.parseEther("0.0001"));
    });
  });
});