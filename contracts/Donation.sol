// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Donation {
    address public immutable RECIPIENT;
    
    event DonationReceived(address indexed donor, uint256 amount);
    
    constructor(address _recipient) {
        RECIPIENT = _recipient;
    }
    
    function donate() external payable {
        require(msg.value > 0, "Donation amount must be greater than 0");
        emit DonationReceived(msg.sender, msg.value);
        payable(RECIPIENT).transfer(msg.value);
    }
    
    receive() external payable {
        revert("Please use the donate function");
    }
} 