// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IStrategy} from "./IStrategy.sol";

contract ManagedVault is ERC4626, Ownable {
    using SafeERC20 for IERC20;

    // Track total assets allocated to strategies
    uint256 public investedAssets;
    constructor(
        IERC20 asset_,
        string memory name_,
        string memory symbol_,
        address initialOwner
    )
        ERC20(name_, symbol_)       // Set custom ERC20 name and symbol
        ERC4626(asset_)              // Set the vault’s underlying asset
        Ownable(initialOwner)        // Set the initial owner
    {}


    /// @notice Allocate funds from vault to a strategy (owner-only)
    function allocate(uint256 amount, IStrategy strategy) external onlyOwner {
        IERC20 vaultToken = IERC20(asset()); // cast asset() address to IERC20
        require(amount <= vaultToken.balanceOf(address(this)), "Not enough free assets");

        // Approve and call strategy (use SafeERC20 library function)
        SafeERC20.forceApprove(vaultToken, address(strategy), amount);
        strategy.deposit(amount);

        investedAssets += amount;
    }

    /// @notice Recall funds from a strategy back to the vault (owner-only)
    function recall(uint256 amount, IStrategy strategy) external onlyOwner {
        require(amount <= investedAssets, "Not enough invested assets");

        // Withdraw from strategy to this vault
        strategy.withdraw(amount, address(this));

        investedAssets -= amount;
    }

    /// @notice Returns total assets: free in vault + invested in strategies
    function totalAssets() public view override returns (uint256) {
        return IERC20(asset()).balanceOf(address(this)) + investedAssets;
    }

    function strategyBalance(IStrategy strategy) external view returns (uint256) {
        return strategy.balance();
    }


}
