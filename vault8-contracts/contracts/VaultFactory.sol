// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ManagedVault.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract VaultFactory is Ownable {
    // List of all vaults deployed by this factory
    address[] public allVaults;

    // Mapping of globally approved strategy contracts
    mapping(address => bool) public approvedStrategies;

    // Events
    event VaultCreated(address indexed vault, address indexed owner, address indexed token);
    event StrategyApproved(address indexed strategy);

    constructor() Ownable(msg.sender) {} //set the owner to deployer

    /// @notice Approve a new strategy globally for vault creation
    function approveStrategy(address strategy) external onlyOwner {
        require(strategy != address(0), "VaultFactory: zero address");
        approvedStrategies[strategy] = true;
        emit StrategyApproved(strategy);
    }

    /// @notice Deploy a new ManagedVault
    function deployVault(
        address token,
        string memory name,
        string memory symbol,
        address[] calldata allowedStrategies
    ) external returns (address vaultAddress) {
        // Verify all strategies are approved
        for (uint256 i = 0; i < allowedStrategies.length; ++i) {
            require(
                approvedStrategies[allowedStrategies[i]],
                "VaultFactory: unapproved strategy"
            );
        }

        ManagedVault vault = new ManagedVault(
            IERC20(token),
            name,
            symbol,
            msg.sender,
            allowedStrategies
        );

        allVaults.push(address(vault));
        emit VaultCreated(address(vault), msg.sender, token);

        return address(vault);
    }

    /// @notice Return total number of vaults deployed
    function vaultCount() external view returns (uint256) {
        return allVaults.length;
    }
}
