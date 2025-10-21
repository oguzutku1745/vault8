/// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "./IStrategy.sol";

interface IStrategy4626Adapter is IStrategy {
    function target() external view returns (address); // ERC4626 vault address
}

contract StrategyAdapter4626 is IStrategy4626Adapter {
    ERC4626 public immutable targetVault;
    IERC20 public immutable asset;

    constructor(ERC4626 _targetVault) {
        require(address(_targetVault) != address(0), "Adapter: zero vault");
        targetVault = _targetVault;
        asset = IERC20(_targetVault.asset());
    }

    // -------------------------------------------------------------
    // IStrategy
    // -------------------------------------------------------------
    function deposit(uint256 amount) external override {
        address vault = msg.sender; // ManagedVault

        // 1️⃣ Pull tokens from the ManagedVault into adapter
        asset.transferFrom(vault, address(this), amount);

        // 2️⃣ Deposit into ERC4626 vault, receiver = ManagedVault
        asset.approve(address(targetVault), amount);
        targetVault.deposit(amount, vault);
    }

    function withdraw(uint256 amount, address to) external override {
        address vault = msg.sender; // ManagedVault

        // ManagedVault owns ERC4626 shares → it must approve adapter to burn them.
        targetVault.withdraw(amount, to, vault);
    }

    function balance() external view override returns (uint256) {
        address vault = msg.sender;
        return targetVault.convertToAssets(targetVault.balanceOf(vault));
    }
    function target() external view returns (address) { return address(targetVault); }
}
