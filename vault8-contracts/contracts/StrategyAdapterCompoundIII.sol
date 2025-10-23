// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IStrategy} from "./IStrategy.sol";

interface IComet {
    function supply(address asset, uint256 amount) external;
    function withdraw(address asset, uint256 amount) external;
    function balanceOf(address account) external view returns (uint256);
    function baseToken() external view returns (address);
}

/// @notice Compound III adapter bound to a single ManagedVault, then sealed forever.
contract StrategyAdapterCompoundIII is IStrategy {
    using SafeERC20 for IERC20;

    // immutable config
    IComet  public immutable comet;
    IERC20  public immutable asset;

    // mutable only until sealed
    address public vault;
    bool public isSealed; // once set, cannot be unset

    error NotVault();
    error AlreadyBound();
    error ZeroAddress();
    error Sealed();

    event VaultBound(address indexed vault);
    event Deposited(uint256 amount);
    event Withdrawn(uint256 amount, address to);

    constructor(IComet _comet, IERC20 _asset) {
        require(address(_comet) != address(0), "Adapter: zero comet");
        require(address(_asset) != address(0), "Adapter: zero asset");
        require(_comet.baseToken() == address(_asset), "Adapter: asset mismatch");
        comet = _comet;
        asset = _asset;
    }

    /// @notice Bind the adapter to a vault (one-time) before sealing.
    function setVault(address newVault) external {
        if (isSealed) revert Sealed();
        if (newVault == address(0)) revert ZeroAddress();
        vault = newVault;
        isSealed = true;
        emit VaultBound(newVault);
    }


    // ---------------- IStrategy ----------------

    // helper to ensure comet has allowance to pull from adapter
    function _ensureCometAllowance(uint256 amount) internal {
        uint256 cur = asset.allowance(address(this), address(comet));
        if (cur < amount) {
            if (cur != 0) {
                SafeERC20.forceApprove(asset, address(comet), 0);
            }
            // set a large allowance to avoid repeated approvals
            SafeERC20.forceApprove(asset, address(comet), type(uint256).max);
        }
    }

    function deposit(uint256 amount) external payable override {
        if (msg.sender != vault) revert NotVault();
        require(amount > 0, "Adapter: zero amount");

        // pull tokens from the vault into the adapter
        asset.safeTransferFrom(vault, address(this), amount);

        // ensure Comet can pull from adapter
        _ensureCometAllowance(amount);

        // supply to Comet (Comet will pull tokens from this adapter and credit adapter)
        comet.supply(address(asset), amount);

        emit Deposited(amount);
    }

    function withdraw(uint256 amount, address to) external override {
        if (msg.sender != vault) revert NotVault();
        require(amount > 0, "Adapter: zero amount");

        // withdraw from Comet (adapter's Comet balance -> adapter token balance)
        comet.withdraw(address(asset), amount);

        // forward underlying back to caller (ManagedVault)
        asset.safeTransfer(to, amount);

        emit Withdrawn(amount, to);
    }

    function balance() external view override returns (uint256) {
        return comet.balanceOf(address(this));
    }
}
