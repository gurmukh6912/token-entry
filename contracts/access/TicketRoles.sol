// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title TicketRoles
 * @dev Role definitions for ticketing system access control
 */
abstract contract TicketRoles is AccessControl {
    // Role definitions
    bytes32 public constant EVENT_MANAGER_ROLE = keccak256("EVENT_MANAGER_ROLE");
    bytes32 public constant TICKET_VALIDATOR_ROLE = keccak256("TICKET_VALIDATOR_ROLE");
    
    /**
     * @dev Grants event manager role to an account
     * @param account Address to grant role to
     */
    function grantEventManagerRole(address account) public onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(EVENT_MANAGER_ROLE, account);
    }
    
    /**
     * @dev Revokes event manager role from an account
     * @param account Address to revoke role from
     */
    function revokeEventManagerRole(address account) public onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(EVENT_MANAGER_ROLE, account);
    }
    
    /**
     * @dev Grants ticket validator role to an account
     * @param account Address to grant role to
     */
    function grantTicketValidatorRole(address account) public onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(TICKET_VALIDATOR_ROLE, account);
    }
    
    /**
     * @dev Revokes ticket validator role from an account
     * @param account Address to revoke role from
     */
    function revokeTicketValidatorRole(address account) public onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(TICKET_VALIDATOR_ROLE, account);
    }
    
    /**
     * @dev Checks if an account has event manager role
     * @param account Address to check
     * @return bool Whether the account has the role
     */
    function isEventManager(address account) public view returns (bool) {
        return hasRole(EVENT_MANAGER_ROLE, account);
    }
    
    /**
     * @dev Checks if an account has ticket validator role
     * @param account Address to check
     * @return bool Whether the account has the role
     */
    function isTicketValidator(address account) public view returns (bool) {
        return hasRole(TICKET_VALIDATOR_ROLE, account);
    }
}