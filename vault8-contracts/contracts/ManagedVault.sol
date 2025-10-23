// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IStrategy} from "./IStrategy.sol";
import {IStrategy4626Adapter} from "./StrategyAdapter4626.sol";

/// tiny helper interface for adapters that expose setVault(...)
interface ISetVault {
    function setVault(address) external;
}

/// minimal helper interface for Solana bridging strategies
interface ISolanaBridgeStrategy {
    function bridge(uint256 amount) external returns (uint64);
    function setLayerZeroOptions(bytes calldata options) external;
}

contract ManagedVault is ERC4626, Ownable {
    using SafeERC20 for IERC20;

    // Track total assets allocated to strategies
    uint256 public investedAssets;
    uint256 private _lastSyncTimestamp; // block timestamp of the most recent sync
    uint8 private _liquidityBuffer; // percentage of assets to keep liquid (0-100)

    address[] private _allowedStrategies;            // ordered list for enumeration
    mapping(address => bool) private _isAllowedStrategy; // quick lookup for checks
    mapping(address => uint256) public strategyBalances; // tracking strategy balances

    constructor(
        IERC20 asset_,
        string memory name_,
        string memory symbol_,
        address initialOwner,
        address[] memory allowedStrategies_,
        uint8 initialLiquidityBuffer
    )
        ERC20(name_, symbol_)
        ERC4626(asset_)
        Ownable(initialOwner)
    {
        require(initialLiquidityBuffer <= 100, "ManagedVault: invalid buffer");
        _liquidityBuffer = initialLiquidityBuffer;

        // store allowed strategies + mapping
        for (uint i = 0; i < allowedStrategies_.length; ++i) {
            address strat = allowedStrategies_[i];
            require(strat != address(0), "ManagedVault: zero-strategy");
            _isAllowedStrategy[strat] = true;
            _allowedStrategies.push(strat);
        }
    }


    /// @notice Allocate funds from vault to a strategy (owner-only)
    function allocate(uint256 amount, IStrategy strategy) external payable onlyOwner {
        require(_isAllowedStrategy[address(strategy)], "ManagedVault: not allowed strategy");

        IERC20 vaultToken = IERC20(asset());
        require(amount <= vaultToken.balanceOf(address(this)), "Not enough free assets");
        require(amount > 0, "Zero amount");

        // try to bind adapter to this vault if it exposes setVault(...)
        // (this is optional and will silently continue on adapters that don't implement it)
        try ISetVault(address(strategy)).setVault(address(this)) {
        } catch {
        }

        // Approve and deposit into strategy
        SafeERC20.forceApprove(vaultToken, address(strategy), amount);
        strategy.deposit{value: msg.value}(amount);

        // Give adapter permission to burn our ERC4626 shares for future recalls (if adapter is 4626)
        try IStrategy4626Adapter(address(strategy)).target() returns (address shareToken) {
            // use forceApprove to handle non-standard tokens / pre-existing allowances
            SafeERC20.forceApprove(IERC20(shareToken), address(strategy), type(uint256).max);
        } catch {
            // non-ERC4626 adapters ignore
        }


        strategyBalances[address(strategy)] += amount;
        investedAssets += amount;
    }

    /// @notice Recall funds from a strategy back into the vault (owner-only)
    function recall(uint256 amount, address strategy) external onlyOwner {
        require(_isAllowedStrategy[strategy], "ManagedVault: strategy not allowed");
        require(amount > 0, "ManagedVault: zero amount");
        require(strategyBalances[strategy] >= amount, "ManagedVault: amount too large");

        // call strategy to withdraw assets back to this vault
        IStrategy(strategy).withdraw(amount, address(this));

        // update accounting
        strategyBalances[strategy] -= amount;
        investedAssets -= amount;
    }


    // dynamic totalAssets(), we can also use investedAssets but this is more accurate. 
    function totalAssets() public view override returns (uint256) {
        uint256 total = IERC20(asset()).balanceOf(address(this));

        for (uint256 i = 0; i < _allowedStrategies.length; ++i) {
            IStrategy strategy = IStrategy(_allowedStrategies[i]);
            total += strategy.balance();
        }
        return total;
    }

    /// @notice Returns total internally tracked allocation across all strategies
    function totalAllocation() external view returns (uint256) {
        return investedAssets;
    }

    /// @notice Returns the timestamp of the last syncInvestedAssets call
    function lastSyncTimestamp() external view returns (uint256) {
        return _lastSyncTimestamp;
    }

    /// @notice Set the liquidity buffer percentage (0-100)
    function setLiquidityBuffer(uint8 bufferPercent) external onlyOwner {
        require(bufferPercent <= 100, "ManagedVault: invalid buffer");
        _liquidityBuffer = bufferPercent;
    }

    /// @notice Get the current liquidity buffer percentage
    function liquidityBuffer() external view returns (uint8) {
        return _liquidityBuffer;
    }

    // dynamic, calls the strategy address for the current balance
    function strategyBalance(IStrategy strategy) external view returns (uint256) {
        return strategy.balance();
    }

    // the allocated balance which is updated only when allocating and recalling assets from a strategy.
    function strategyAllocation(address strategy) external view returns (uint256) {
        return strategyBalances[strategy];
    }


    /// @notice Check if a strategy is allowed
    function isStrategyAllowed(address strategy) public view returns (bool) {
        return _isAllowedStrategy[strategy];
    }

    /// @notice Return the whole allowed strategy list
    function allowedStrategies() external view returns (address[] memory) {
        return _allowedStrategies;
    }

    /// @notice Reconcile internal accounting with actual strategy balances //CHECK
    function syncInvestedAssets() external onlyOwner {
        uint256 total = 0;

        for (uint256 i = 0; i < _allowedStrategies.length; ++i) {
            address strat = _allowedStrategies[i];
            uint256 actual = IStrategy(strat).balance();
            strategyBalances[strat] = actual; // update ledger
            total += actual;
        }

        investedAssets = total;
        _lastSyncTimestamp = block.timestamp;
    }

    // ---------------------------------------------------------------------
    // Solana bridge helpers
    // ---------------------------------------------------------------------

    /// @notice Trigger the CCTP bridge step on a Solana strategy.
    function initiateBridge(address strategy, uint256 amount) external onlyOwner returns (uint64 nonce) {
        require(_isAllowedStrategy[strategy], "ManagedVault: strategy not allowed");
        require(amount > 0, "ManagedVault: zero amount");

        // bind vault if adapter supports it
        try ISetVault(strategy).setVault(address(this)) {
        } catch {
        }

        IERC20 vaultToken = IERC20(asset());
        require(amount <= vaultToken.balanceOf(address(this)), "Not enough free assets");

        SafeERC20.forceApprove(vaultToken, strategy, amount);
        nonce = ISolanaBridgeStrategy(strategy).bridge(amount);
    }

    /// @notice Update LayerZero execution options on a Solana strategy.
    function configureBridgeOptions(address strategy, bytes calldata options) external onlyOwner {
        require(_isAllowedStrategy[strategy], "ManagedVault: strategy not allowed");
        ISolanaBridgeStrategy(strategy).setLayerZeroOptions(options);
    }
}
