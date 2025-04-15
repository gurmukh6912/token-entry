// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IEventTicketing.sol";
import "./access/TicketRoles.sol";

/**
 * @title TicketMarketplace
 * @dev Contract for secondary market ticket sales with royalties
 */
contract TicketMarketplace is ReentrancyGuard, TicketRoles {
    // Listing structure
    struct Listing {
        address seller;
        uint256 price;
        bool active;
    }
    
    // Constants
    uint256 public constant MAX_PRICE_MULTIPLIER = 150; // 150% of original price
    uint256 public constant ROYALTY_PERCENTAGE = 10; // 10% royalty to event organizer
    
    // Ticket contract
    IEventTicketing public ticketContract;
    
    // Mapping from tokenId to Listing
    mapping(uint256 => Listing) public listings;
    
    // Events
    event TicketListed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event TicketSold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price);
    event ListingCanceled(uint256 indexed tokenId, address indexed seller);
    event RoyaltyPaid(uint256 indexed tokenId, uint256 amount);
    
    // Allow the contract to receive ETH
    receive() external payable {}
    
    fallback() external payable {}
    
    constructor(address _ticketContract) {
        require(_ticketContract != address(0), "Invalid ticket contract address");
        ticketContract = IEventTicketing(_ticketContract);
        
        // Set the deployer as admin
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }
    
    /**
     * @dev Lists a ticket for sale
     * @param tokenId Ticket token ID
     * @param price Listing price
     */
    function listTicket(uint256 tokenId, uint256 price) public {
        // Check ticket ownership
        require(ticketContract.ownerOf(tokenId) == msg.sender, "Not the ticket owner");
        
        // Check if ticket is valid (not used and event is active)
        require(ticketContract.isTicketValid(tokenId), "Ticket is not valid for resale");
        
        // Verify price doesn't exceed max allowed price
        (,uint256 originalPrice,) = ticketContract.getTicketDetails(tokenId);
        uint256 maxAllowedPrice = (originalPrice * MAX_PRICE_MULTIPLIER) / 100;
        require(price <= maxAllowedPrice, "Price exceeds maximum allowed");
        
        // Check if marketplace is approved to transfer the ticket
        // NOTE: The seller must call approve(marketplace, tokenId) before listing
        require(
            ticketContract.getApproved(tokenId) == address(this) ||
            ticketContract.isApprovedForAll(msg.sender, address(this)),
            "Marketplace not approved to transfer ticket"
        );
        
        // Create the listing
        listings[tokenId] = Listing({
            seller: msg.sender,
            price: price,
            active: true
        });
        
        emit TicketListed(tokenId, msg.sender, price);
    }
    
    /**
     * @dev Purchases a listed ticket
     * @param tokenId Ticket token ID
     */
    function purchaseTicket(uint256 tokenId) public payable nonReentrant {
        Listing storage listing = listings[tokenId];
        
        require(listing.active, "Listing is not active");
        require(listing.seller != msg.sender, "Cannot buy your own listing");
        require(msg.value >= listing.price, "Insufficient payment");
        
        // Check if ticket is still valid
        require(ticketContract.isTicketValid(tokenId), "Ticket is no longer valid");
        
        // Calculate royalty amount
        uint256 royaltyAmount = (listing.price * ROYALTY_PERCENTAGE) / 100;
        uint256 sellerAmount = listing.price - royaltyAmount;
        
        // Mark listing as inactive before external calls (prevent reentrancy)
        listing.active = false;
        
        // Store local variables to avoid storage access after external calls
        address seller = listing.seller;
        uint256 price = listing.price;
        
        // Transfer the ticket - using safeTransferFrom to ensure recipient can receive ERC721
        ticketContract.safeTransferFrom(seller, msg.sender, tokenId);
        
        // Pay the seller
        (bool sellerSuccess, ) = payable(seller).call{value: sellerAmount}("");
        require(sellerSuccess, "Failed to send ETH to seller");
        
        // Pay royalty to the event organizer
        address organizer = ticketContract.owner();
        (bool organizerSuccess, ) = payable(organizer).call{value: royaltyAmount}("");
        require(organizerSuccess, "Failed to send royalty");
        
        emit TicketSold(tokenId, seller, msg.sender, price);
        emit RoyaltyPaid(tokenId, royaltyAmount);
        
        // Refund excess payment if any
        uint256 excess = msg.value - price;
        if (excess > 0) {
            (bool refundSuccess, ) = payable(msg.sender).call{value: excess}("");
            require(refundSuccess, "Failed to refund excess");
        }
    }
    
    /**
     * @dev Cancels a ticket listing
     * @param tokenId Ticket token ID
     */
    function cancelListing(uint256 tokenId) public {
        Listing storage listing = listings[tokenId];
        
        require(listing.active, "Listing is not active");
        require(listing.seller == msg.sender || hasRole(DEFAULT_ADMIN_ROLE, msg.sender), 
                "Not the seller or admin");
        
        // Mark listing as inactive
        listing.active = false;
        
        emit ListingCanceled(tokenId, listing.seller);
    }
    
    /**
     * @dev Gets listing details
     * @param tokenId Ticket token ID
     */
    function getListing(uint256 tokenId) public view returns (
        address seller,
        uint256 price,
        bool active
    ) {
        Listing storage listing = listings[tokenId];
        return (listing.seller, listing.price, listing.active);
    }
    
    /**
     * @dev Allows admin to update ticket contract address if needed
     * @param _ticketContract New ticket contract address
     */
    function updateTicketContract(address _ticketContract) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_ticketContract != address(0), "Invalid ticket contract address");
        ticketContract = IEventTicketing(_ticketContract);
    }
}