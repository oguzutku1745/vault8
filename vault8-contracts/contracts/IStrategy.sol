// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IStrategy {
    // Vault deposits tokens into this strategy
    function deposit(uint256 amount) external payable;

    // Vault withdraws tokens back
    function withdraw(uint256 amount, address to) external;

    // Returns current strategy balance (in underlying token)
    function balance() external view returns (uint256);
}
