// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./access/TicketRoles.sol";
import "./libraries/TicketingLib.sol";

/**
 * @title EventTicketing
 * @dev Main contract for creating and managing event tickets as NFTs
 */
contract EventTicketing is ERC721, TicketRoles {
    // Store the owner address explicitly
    address private _owner;
    
    // Token ID counter
    uint256 private _nextTokenId;
    
    // Event ID counter
    uint256 private _nextEventId;
    
    // Event structure
    struct Event {
        string name;
        uint256 price;
        uint256 ticketCount;
        uint256 maxTicketsPerBuyer;
        uint256 startTime;
        uint256 endTime;
        bool active;
    }
    
    // Ticket structure
    struct Ticket {
        uint256 eventId;
        bool used;
        uint256 purchasePrice;
    }
    
    // Mapping from eventId to Event
    mapping(uint256 => Event) public events;
    
    // Mapping from tokenId to Ticket
    mapping(uint256 => Ticket) public tickets;
    
    // Mapping from eventId to count of tickets created
    mapping(uint256 => uint256) public eventTicketCount;
    
    // Mapping from address to count of tickets purchased per event
    mapping(address => mapping(uint256 => uint256)) public purchaseCounts;
    
    // Events
    event EventCreated(uint256 indexed eventId, string name, uint256 price, uint256 ticketCount);
    event TicketMinted(uint256 indexed tokenId, uint256 indexed eventId, address buyer);
    event TicketUsed(uint256 indexed tokenId, uint256 indexed eventId);
    event EventStatusChanged(uint256 indexed eventId, bool active);

    constructor() ERC721("EventTicket", "ETIX") {
        // Store the owner address
        _owner = msg.sender;
        
        // The deployer address becomes the admin
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(EVENT_MANAGER_ROLE, msg.sender);
        
        // Start IDs at 1
        _nextTokenId = 1;
        _nextEventId = 1;
    }
    
    /**
     * @dev Creates a new event
     * @param name Event name
     * @param price Ticket price in wei
     * @param ticketCount Total number of tickets available
     * @param maxTicketsPerBuyer Maximum tickets per buyer
     * @param startTime Event start time
     * @param endTime Event end time
     */
    function createEvent(
        string memory name,
        uint256 price,
        uint256 ticketCount,
        uint256 maxTicketsPerBuyer,
        uint256 startTime,
        uint256 endTime
    ) public onlyRole(EVENT_MANAGER_ROLE) {
        require(bytes(name).length > 0, "Name cannot be empty");
        require(ticketCount > 0, "Ticket count must be greater than 0");
        require(maxTicketsPerBuyer > 0, "Max tickets per buyer must be greater than 0");
        require(startTime < endTime, "End time must be after start time");
        
        uint256 eventId = _nextEventId;
        _nextEventId += 1;
        
        events[eventId] = Event({
            name: name,
            price: price,
            ticketCount: ticketCount,
            maxTicketsPerBuyer: maxTicketsPerBuyer,
            startTime: startTime,
            endTime: endTime,
            active: true
        });
        
        emit EventCreated(eventId, name, price, ticketCount);
    }
    
    /**
     * @dev Purchases a ticket for an event
     * @param eventId Event ID
     */
    function purchaseTicket(uint256 eventId) public payable {
        Event storage eventItem = events[eventId];
        
        require(eventItem.active, "Event is not active");
        require(block.timestamp < eventItem.endTime, "Event has ended");
        require(eventTicketCount[eventId] < eventItem.ticketCount, "Event is sold out");
        require(msg.value >= eventItem.price, "Insufficient payment");
        require(
            purchaseCounts[msg.sender][eventId] < eventItem.maxTicketsPerBuyer, 
            "Exceeded max tickets per buyer"
        );
        
        uint256 tokenId = _nextTokenId;
        _nextTokenId += 1;
        
        // Mint the ticket
        _safeMint(msg.sender, tokenId);
        
        // Store ticket info
        tickets[tokenId] = Ticket({
            eventId: eventId,
            used: false,
            purchasePrice: eventItem.price
        });
        
        // Update purchase count for this buyer
        purchaseCounts[msg.sender][eventId]++;
        
        // Update ticket count for this event
        eventTicketCount[eventId]++;
        
        emit TicketMinted(tokenId, eventId, msg.sender);
        
        // Refund excess payment
        if (msg.value > eventItem.price) {
            payable(msg.sender).transfer(msg.value - eventItem.price);
        }
    }
    
    /**
     * @dev Mark a ticket as used
     * @param tokenId Ticket token ID
     */
    function useTicket(uint256 tokenId) public onlyRole(TICKET_VALIDATOR_ROLE) {
        require(_exists(tokenId), "Ticket does not exist");
        require(!tickets[tokenId].used, "Ticket already used");
        
        tickets[tokenId].used = true;
        
        emit TicketUsed(tokenId, tickets[tokenId].eventId);
    }
    
    /**
     * @dev Check if a token exists
     * @param tokenId The token ID to check
     * @return bool Whether the token exists
     */
    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }
    
    /**
     * @dev Set event active status
     * @param eventId Event ID
     * @param active Active status
     */
    function setEventStatus(uint256 eventId, bool active) public onlyRole(EVENT_MANAGER_ROLE) {
        require(events[eventId].startTime > 0, "Event does not exist");
        
        events[eventId].active = active;
        
        emit EventStatusChanged(eventId, active);
    }
    
    /**
     * @dev Get basic event details
     * @param eventId Event ID
     */
    function getBasicEventDetails(uint256 eventId) public view returns (
        string memory name,
        uint256 price,
        uint256 ticketCount,
        bool active
    ) {
        Event storage eventItem = events[eventId];
        return (
            eventItem.name,
            eventItem.price,
            eventItem.ticketCount,
            eventItem.active
        );
    }
    
    /**
     * @dev Get event time details
     * @param eventId Event ID
     */
    function getEventTimeDetails(uint256 eventId) public view returns (
        uint256 maxTicketsPerBuyer,
        uint256 startTime,
        uint256 endTime,
        uint256 ticketsSold
    ) {
        Event storage eventItem = events[eventId];
        return (
            eventItem.maxTicketsPerBuyer,
            eventItem.startTime,
            eventItem.endTime,
            eventTicketCount[eventId]
        );
    }
    
    /**
     * @dev Get ticket details
     * @param tokenId Ticket token ID
     */
    function getTicketDetails(uint256 tokenId) public view returns (
        uint256 eventId,
        uint256 purchasePrice,
        bool used
    ) {
        require(_exists(tokenId), "Ticket does not exist");
        Ticket storage ticket = tickets[tokenId];
        return (
            ticket.eventId,
            ticket.purchasePrice,
            ticket.used
        );
    }
    
    /**
     * @dev Check if a ticket is valid
     * @param tokenId Ticket token ID
     */
    function isTicketValid(uint256 tokenId) public view returns (bool) {
        if (!_exists(tokenId)) {
            return false;
        }
        
        Ticket storage ticket = tickets[tokenId];
        Event storage eventItem = events[ticket.eventId];
        
        return (
            !ticket.used && 
            eventItem.active &&
            block.timestamp <= eventItem.endTime
        );
    }
    
    /**
     * @dev Withdraw contract balance to admin
     */
    function withdraw() public onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        
        payable(msg.sender).transfer(balance);
    }
    
    /**
     * @dev Returns the contract owner (for marketplace integration)
     */
    function owner() public view returns (address) {
        // Return the explicitly stored owner address
        return _owner;
    }
    
    // The following function is an override required by Solidity
    
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}