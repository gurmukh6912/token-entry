// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/**
 * @title IEventTicketing
 * @dev Interface for the EventTicketing contract
 */
interface IEventTicketing is IERC721 {
    /**
     * @dev Returns if a ticket is valid (not used and event is active)
     * @param tokenId Ticket token ID
     * @return bool Valid status
     */
    function isTicketValid(uint256 tokenId) external view returns (bool);
    
    /**
     * @dev Returns ticket details
     * @param tokenId Ticket token ID
     * @return eventId Event ID
     * @return purchasePrice Original purchase price
     * @return used Whether ticket has been used
     */
    function getTicketDetails(uint256 tokenId) external view returns (
        uint256 eventId,
        uint256 purchasePrice,
        bool used
    );
    
    /**
     * @dev Returns the contract owner address
     * @return address Owner address
     */
    function owner() external view returns (address);
}