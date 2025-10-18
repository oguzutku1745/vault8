// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./IStrategy.sol";

contract MockStrategy is IStrategy {
    using SafeERC20 for ERC20;

    ERC20 public token;
    uint256 public strategyBalance;

    constructor(ERC20 _token) {
        token = _token;
    }

    // Vault deposits tokens into this strategy
    function deposit(uint256 amount) external override {
        token.safeTransferFrom(msg.sender, address(this), amount);
        strategyBalance += amount;
    }

    // Vault recalls tokens
    function withdraw(uint256 amount, address to) external override {
        require(strategyBalance >= amount, "Not enough balance");
        strategyBalance -= amount;
        token.safeTransfer(to, amount);
    }

    // View current strategy balance
    function balance() external view override returns (uint256) {
        return strategyBalance;
    }

    // Optional: simulate interest for testing
    function accrueInterest(uint256 amount) external {
        strategyBalance += amount;
    }
}
