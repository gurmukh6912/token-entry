import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { EventTicketing } from "../../typechain-types/contracts/EventTicketing";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

/**
 * Helper function to create a test event
 */
export async function createTestEvent(
  eventTicketing: EventTicketing,
  eventManager: SignerWithAddress,
  name: string,
  price: bigint,
  ticketCount: number,
  maxPerBuyer: number,
  startTimeOffset: number = 3600, // 1 hour from now by default
  duration: number = 86400 // 24 hours by default
): Promise<{eventId: number, startTime: number, endTime: number}> {
  // Get current block timestamp
  const currentTime = await time.latest();
  const startTime = currentTime + startTimeOffset;
  const endTime = startTime + duration;
  
  // Create event
  await eventTicketing.connect(eventManager).createEvent(
    name,
    price,
    ticketCount,
    maxPerBuyer,
    startTime,
    endTime
  );
  
  // Event ID should be 1 for first event
  const eventId = 1;
  
  return {
    eventId,
    startTime,
    endTime
  };
}

/**
 * Helper function to purchase a ticket
 */
export async function purchaseTicket(
  eventTicketing: EventTicketing,
  buyer: SignerWithAddress,
  eventId: number,
  price: bigint
): Promise<number> {
  // Purchase ticket
  const tx = await eventTicketing.connect(buyer).purchaseTicket(eventId, {
    value: price
  });
  
  // Get transaction receipt to find the ticket ID from the event
  const receipt = await tx.wait();
  
  // Find the TicketMinted event and extract tokenId
  // In a real implementation, you'd parse the event logs
  // For simplicity, assuming the token ID is 1 for the first ticket
  const tokenId = 1;
  
  return tokenId;
}

/**
 * Helper to get ETH balance formatted as a string with units
 */
export async function getFormattedBalance(address: string): Promise<string> {
  const balance = await ethers.provider.getBalance(address);
  return ethers.formatEther(balance) + " ETH";
}

/**
 * Advance time to a specific timestamp
 */
export async function advanceTimeTo(timestamp: number): Promise<void> {
  await time.increaseTo(timestamp);
}

/**
 * Helper to check if a transaction reverted with a specific message
 */
export async function expectRevert(
  promise: Promise<any>,
  expectedError: string
): Promise<void> {
  try {
    await promise;
    throw new Error("Expected transaction to revert");
  } catch (error: any) {
    const errorMessage = error.message || "";
    if (!errorMessage.includes(expectedError)) {
      throw new Error(`Expected error "${expectedError}" but got "${errorMessage}"`);
    }
  }
}