// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title ITicketMarketplace
 * @dev Interface for the TicketMarketplace contract
 */
interface ITicketMarketplace {
    /**
     * @dev Lists a ticket for sale
     * @param tokenId Ticket token ID
     * @param price Listing price
     */
    function listTicket(uint256 tokenId, uint256 price) external;
    
    /**
     * @dev Purchases a listed ticket
     * @param tokenId Ticket token ID
     */
    function purchaseTicket(uint256 tokenId) external payable;
    
    /**
     * @dev Cancels a ticket listing
     * @param tokenId Ticket token ID
     */
    function cancelListing(uint256 tokenId) external;
    
    /**
     * @dev Gets listing details
     * @param tokenId Ticket token ID
     * @return seller Seller address
     * @return price Listing price
     * @return active Listing status
     */
    function getListing(uint256 tokenId) external view returns (
        address seller,
        uint256 price,
        bool active
    );
}