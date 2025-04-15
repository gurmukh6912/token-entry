// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title TicketingLib
 * @dev Library with helper functions for ticketing operations
 */
library TicketingLib {
    /**
     * @dev Generates a simple ticket URI
     * @param eventName Name of the event
     * @param eventDate Date of the event in string format
     * @param ticketNumber Number of the ticket
     * @return string URI for the ticket metadata
     */
    function generateTicketURI(
        string memory eventName,
        string memory eventDate,
        uint256 ticketNumber
    ) internal pure returns (string memory) {
        return string(
            abi.encodePacked(
                "data:application/json;base64,",
                encodeBase64(
                    abi.encodePacked(
                        '{"name":"Ticket #',
                        toString(ticketNumber),
                        ' - ',
                        eventName,
                        '","description":"Official ticket for ',
                        eventName,
                        ' on ',
                        eventDate,
                        '","attributes":[{"trait_type":"Event","value":"',
                        eventName,
                        '"},{"trait_type":"Date","value":"',
                        eventDate,
                        '"},{"trait_type":"Ticket Number","value":',
                        toString(ticketNumber),
                        '}]}'
                    )
                )
            )
        );
    }
    
    /**
     * @dev Converts a uint256 to a string
     * @param value The uint256 to convert
     * @return string The string representation
     */
    function toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        
        uint256 temp = value;
        uint256 digits;
        
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        
        bytes memory buffer = new bytes(digits);
        
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        
        return string(buffer);
    }
    
    /**
     * @dev Simple base64 encoding function
     * Note: In a real implementation, you would use a more robust solution
     * This is a simplified version for demonstration purposes
     */
    function encodeBase64(bytes memory data) internal pure returns (string memory) {
        string memory table = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        uint256 length = data.length;
        
        if (length == 0) return "";
        
        // Calculate output length: 4 * ceiling(len / 3)
        uint256 encodedLen = 4 * ((length + 2) / 3);
        
        // Create output buffer
        bytes memory result = new bytes(encodedLen);
        
        uint256 i;
        uint256 j = 0;
        
        // Basic implementation of Base64 encoding
        // In practice, you'd use a library or more optimized approach
        for (i = 0; i < length; i += 3) {
            uint256 a = uint8(data[i]);
            uint256 b = i + 1 < length ? uint8(data[i + 1]) : 0;
            uint256 c = i + 2 < length ? uint8(data[i + 2]) : 0;
            
            uint256 triple = (a << 16) | (b << 8) | c;
            
            result[j] = bytes(table)[triple >> 18 & 0x3F];
            result[j + 1] = bytes(table)[triple >> 12 & 0x3F];
            result[j + 2] = bytes(table)[triple >> 6 & 0x3F];
            result[j + 3] = bytes(table)[triple & 0x3F];
            
            j += 4;
        }
        
        // Add padding if needed
        if (length % 3 == 1) {
            result[encodedLen - 2] = '=';
            result[encodedLen - 1] = '=';
        } else if (length % 3 == 2) {
            result[encodedLen - 1] = '=';
        }
        
        return string(result);
    }
    
    /**
     * @dev Validates a date string format (simplified)
     * @param dateStr Date string in format YYYY-MM-DD
     * @return bool Whether the date is valid
     */
    function isValidDate(string memory dateStr) internal pure returns (bool) {
        bytes memory dateBytes = bytes(dateStr);
        
        // Simple length check for YYYY-MM-DD
        if (dateBytes.length != 10) {
            return false;
        }
        
        // Check for hyphens in the right places
        if (dateBytes[4] != '-' || dateBytes[7] != '-') {
            return false;
        }
        
        // Check each character is a digit where expected
        for (uint i = 0; i < dateBytes.length; i++) {
            if (i != 4 && i != 7) { // Skip the hyphens
                if (uint8(dateBytes[i]) < 48 || uint8(dateBytes[i]) > 57) {
                    return false;
                }
            }
        }
        
        return true;
    }
}