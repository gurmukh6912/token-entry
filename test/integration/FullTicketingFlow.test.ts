import { expect } from "chai";
import { ethers } from "hardhat";
import { EventTicketing } from "../../typechain-types/contracts/EventTicketing";
import { TicketMarketplace } from "../../typechain-types/contracts/TicketMarketplace";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("Full Ticketing Flow Integration", function () {
  let eventTicketing: EventTicketing;
  let ticketMarketplace: TicketMarketplace;
  let owner: SignerWithAddress;
  let eventManager: SignerWithAddress;
  let validator: SignerWithAddress;
  let buyer1: SignerWithAddress;
  let buyer2: SignerWithAddress;
  
  // Constants for testing
  const EVENT_NAME = "Summer Music Festival";
  const TICKET_PRICE = ethers.parseEther("0.2"); // 0.2 ETH
  const TOTAL_TICKETS = 100;
  const MAX_PER_BUYER = 2;
  const EVENT_ID = 1;
  
  // Calculate timestamps for event
  let startTime: number;
  let endTime: number;
  
  beforeEach(async function () {
    // Get current block timestamp
    const currentTime = await time.latest();
    startTime = currentTime + 3600; // Start 1 hour from now
    endTime = startTime + 7 * 86400; // End 7 days after start

    // Get signers
    [owner, eventManager, validator, buyer1, buyer2] = await ethers.getSigners();
    
    // Deploy EventTicketing contract
    const EventTicketingFactory = await ethers.getContractFactory("EventTicketing");
    eventTicketing = await EventTicketingFactory.deploy() as EventTicketing;
    
    // Deploy TicketMarketplace contract
    const TicketMarketplaceFactory = await ethers.getContractFactory("TicketMarketplace");
    ticketMarketplace = await TicketMarketplaceFactory.deploy(eventTicketing.target) as TicketMarketplace;
    
    // Set up roles
    await eventTicketing.grantEventManagerRole(eventManager.address);
    await eventTicketing.grantTicketValidatorRole(validator.address);
  });
  
  it("Should execute a complete ticket lifecycle", async function () {
    // Step 1: Create an event
    await eventTicketing.connect(eventManager).createEvent(
      EVENT_NAME,
      TICKET_PRICE,
      TOTAL_TICKETS,
      MAX_PER_BUYER,
      startTime,
      endTime
    );
    
    // Verify event creation
    const [name, price, ticketCount, active] = await eventTicketing.getBasicEventDetails(EVENT_ID);
    expect(name).to.equal(EVENT_NAME);
    expect(price).to.equal(TICKET_PRICE);
    expect(ticketCount).to.equal(TOTAL_TICKETS);
    expect(active).to.be.true;
    
    // Step 2: Fast forward to event start time
    await time.increaseTo(startTime + 1);
    
    // Step 3: Buyer1 purchases a ticket
    await eventTicketing.connect(buyer1).purchaseTicket(EVENT_ID, {
      value: TICKET_PRICE
    });
    
    // Verify purchase
    expect(await eventTicketing.ownerOf(1)).to.equal(buyer1.address);
    
    // Step 4: Buyer1 first approves marketplace to transfer the ticket
    // This is a required step before listing on the marketplace
    await eventTicketing.connect(buyer1).approve(ticketMarketplace.target, 1);
    const resalePrice = ethers.parseEther("0.25"); // 0.25 ETH
    
    // Now buyer1 can list the ticket on the marketplace
    await ticketMarketplace.connect(buyer1).listTicket(1, resalePrice);
    
    // Verify listing
    const [seller, priceNew, listingActive] = await ticketMarketplace.getListing(1);
    expect(seller).to.equal(buyer1.address);
    expect(priceNew).to.equal(resalePrice);
    expect(listingActive).to.be.true;
    
    // Step 5: Buyer2 purchases ticket from marketplace
    await ticketMarketplace.connect(buyer2).purchaseTicket(1, {
      value: resalePrice
    });
    
    // Verify ownership transfer
    expect(await eventTicketing.ownerOf(1)).to.equal(buyer2.address);
    
    // Verify listing is no longer active
    const [, , listingActiveAfterPurchase] = await ticketMarketplace.getListing(1);
    expect(listingActiveAfterPurchase).to.be.false;
    
    // Step 6: Validate ticket at event
    await eventTicketing.connect(validator).useTicket(1);
    
    // Verify ticket is marked as used
    const [, , used] = await eventTicketing.getTicketDetails(1);
    expect(used).to.be.true;
    
    // Verify ticket is no longer valid
    expect(await eventTicketing.isTicketValid(1)).to.be.false;
    
    // Step 7: Try to list used ticket (should fail)
    await eventTicketing.connect(buyer2).approve(ticketMarketplace.target, 1);
    
    await expect(
      ticketMarketplace.connect(buyer2).listTicket(1, resalePrice)
    ).to.be.revertedWith("Ticket is not valid for resale");
  });
  
  it("Should enforce anti-scalping measures", async function () {
    // Create an event
    await eventTicketing.connect(eventManager).createEvent(
      EVENT_NAME,
      TICKET_PRICE,
      TOTAL_TICKETS,
      MAX_PER_BUYER,
      startTime,
      endTime
    );
    
    // Fast forward to event start time
    await time.increaseTo(startTime + 1);
    
    // Buyer1 purchases a ticket
    await eventTicketing.connect(buyer1).purchaseTicket(EVENT_ID, {
      value: TICKET_PRICE
    });
    
    // Approve marketplace for future transfer
    await eventTicketing.connect(buyer1).approve(ticketMarketplace.target, 1);
    
    // Calculate max allowed price (150% of original)
    const maxAllowedPrice = (TICKET_PRICE * 150n) / 100n;
    const tooHighPrice = maxAllowedPrice + ethers.parseEther("0.01");
    
    // Try to list with price exceeding allowed maximum
    await expect(
      ticketMarketplace.connect(buyer1).listTicket(1, tooHighPrice)
    ).to.be.revertedWith("Price exceeds maximum allowed");
    
    // List with acceptable price
    await ticketMarketplace.connect(buyer1).listTicket(1, maxAllowedPrice);
    
    // Verify royalty payment when ticket is sold
    const organizerInitialBalance = await ethers.provider.getBalance(owner.address);
    
    // Buy the ticket
    await ticketMarketplace.connect(buyer2).purchaseTicket(1, {
      value: maxAllowedPrice
    });
    
    // Calculate expected royalty (10%)
    const royaltyAmount = (maxAllowedPrice * 10n) / 100n;
    
    // Verify organizer received royalty
    const organizerFinalBalance = await ethers.provider.getBalance(owner.address);
    const organizerBalanceDiff = organizerFinalBalance - organizerInitialBalance;
    expect(organizerBalanceDiff).to.be.closeTo(royaltyAmount, ethers.parseEther("0.0001"));
  });
  
  it("Should handle event lifecycle management", async function () {
    // Create an event
    await eventTicketing.connect(eventManager).createEvent(
      EVENT_NAME,
      TICKET_PRICE,
      TOTAL_TICKETS,
      MAX_PER_BUYER,
      startTime,
      endTime
    );
    
    // Fast forward to event start time
    await time.increaseTo(startTime + 1);
    
    // Buyer purchases a ticket
    await eventTicketing.connect(buyer1).purchaseTicket(EVENT_ID, {
      value: TICKET_PRICE
    });
    
    // Event manager cancels the event
    await eventTicketing.connect(eventManager).setEventStatus(EVENT_ID, false);
    
    // Verify ticket is no longer valid
    expect(await eventTicketing.isTicketValid(1)).to.be.false;
    
    // Try to list invalid ticket on marketplace
    // First approve the marketplace
    await eventTicketing.connect(buyer1).approve(ticketMarketplace.target, 1);
    const resalePrice = ethers.parseEther("0.25");
    
    // Attempt to list should fail because the ticket is not valid
    await expect(
      ticketMarketplace.connect(buyer1).listTicket(1, resalePrice)
    ).to.be.revertedWith("Ticket is not valid for resale");
    
    // Event manager reactivates the event
    await eventTicketing.connect(eventManager).setEventStatus(EVENT_ID, true);
    
    // Verify ticket is valid again
    expect(await eventTicketing.isTicketValid(1)).to.be.true;
    
    // Now listing should work
    await ticketMarketplace.connect(buyer1).listTicket(1, resalePrice);
    
    // Fast forward to event end time
    await time.increaseTo(endTime + 1);
    
    // Verify ticket is no longer valid after event end time
    expect(await eventTicketing.isTicketValid(1)).to.be.false;
    
    // Verify marketplace rejects purchase of invalid ticket
    const [, , listingActive] = await ticketMarketplace.getListing(1);
    if (listingActive) {
      await expect(
        ticketMarketplace.connect(buyer2).purchaseTicket(1, {
          value: resalePrice
        })
      ).to.be.revertedWith("Ticket is no longer valid");
    }
  });

  it("Should handle ticket purchase refunds correctly", async function() {
    // Create an event
    await eventTicketing.connect(eventManager).createEvent(
      EVENT_NAME,
      TICKET_PRICE,
      TOTAL_TICKETS,
      MAX_PER_BUYER,
      startTime,
      endTime
    );
    
    // Fast forward to event start time
    await time.increaseTo(startTime + 1);
    
    const excessAmount = ethers.parseEther("0.1"); // 0.1 ETH excess
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

    // Verify the contract received the correct amount
    const contractBalance = await ethers.provider.getBalance(eventTicketing.target);
    expect(contractBalance).to.equal(TICKET_PRICE);
  });

  it("Should handle multiple ticket purchases up to max limit", async function() {
    // Create an event with a max of 2 tickets per buyer
    await eventTicketing.connect(eventManager).createEvent(
      EVENT_NAME,
      TICKET_PRICE,
      TOTAL_TICKETS,
      MAX_PER_BUYER,
      startTime,
      endTime
    );
    
    // Fast forward to event start time
    await time.increaseTo(startTime + 1);
    
    // First ticket purchase should succeed
    await eventTicketing.connect(buyer1).purchaseTicket(EVENT_ID, {
      value: TICKET_PRICE
    });
    
    // Second ticket purchase should succeed
    await eventTicketing.connect(buyer1).purchaseTicket(EVENT_ID, {
      value: TICKET_PRICE
    });
    
    // Third ticket purchase should fail
    await expect(
      eventTicketing.connect(buyer1).purchaseTicket(EVENT_ID, {
        value: TICKET_PRICE
      })
    ).to.be.revertedWith("Exceeded max tickets per buyer");
    
    // Another buyer should still be able to purchase
    await eventTicketing.connect(buyer2).purchaseTicket(EVENT_ID, {
      value: TICKET_PRICE
    });
    
    // Check total tickets sold
    const [,,, ticketsSold] = await eventTicketing.getEventTimeDetails(EVENT_ID);
    expect(ticketsSold).to.equal(3);
  });
});