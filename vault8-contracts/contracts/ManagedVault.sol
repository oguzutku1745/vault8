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

    address[] private _allowedStrategies;            // ordered list for enumeration
    mapping(address => bool) private _isAllowedStrategy; // quick lookup for checks
    mapping(address => uint256) public strategyBalances; // tracking strategy balances

    constructor(
        IERC20 asset_,
        string memory name_,
        string memory symbol_,
        address initialOwner,
        address[] memory allowedStrategies_
    )
        ERC20(name_, symbol_)
        ERC4626(asset_)
        Ownable(initialOwner)
    {
        // store allowed strategies + mapping
        for (uint i = 0; i < allowedStrategies_.length; ++i) {
            address strat = allowedStrategies_[i];
            require(strat != address(0), "ManagedVault: zero-strategy");
            _isAllowedStrategy[strat] = true;
            _allowedStrategies.push(strat);
        }
    }


    /// @notice Allocate funds from vault to a strategy (owner-only)
    function allocate(uint256 amount, IStrategy strategy) external onlyOwner {
        require(_isAllowedStrategy[address(strategy)], "ManagedVault: not allowed strategy");

        IERC20 vaultToken = IERC20(asset());
        require(amount <= vaultToken.balanceOf(address(this)), "Not enough free assets");
        require(amount > 0, "Zero amount");

        // Approve and deposit into strategy
        SafeERC20.forceApprove(vaultToken, address(strategy), amount);
        strategy.deposit(amount);

        strategyBalances[address(strategy)] += amount;
        investedAssets += amount;
    }

    /// @notice Recall funds from a strategy back to the vault (owner-only)
    function recall(uint256 amount, IStrategy strategy) external onlyOwner {
        require(_isAllowedStrategy[address(strategy)], "ManagedVault: not allowed strategy");
        require(amount > 0, "Zero amount");
        require(amount <= investedAssets, "Not enough invested assets");

        // Withdraw from strategy to this vault
        strategy.withdraw(amount, address(this));

        strategyBalances[address(strategy)] -= amount;
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
    }
}
