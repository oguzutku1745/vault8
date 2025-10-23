// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ManagedVault.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract VaultFactory is Ownable {
    // Global registry of approved strategy addresses
    mapping(address => bool) public isApprovedStrategy;
    address[] public approvedStrategiesList;

    // Track all deployed vaults
    address[] public allVaults;

    // Track vault owners
    mapping(address => address[]) private ownerVaults;
    mapping(address => address) private vaultOwners;

    event StrategyApproved(address indexed strategy);
    event StrategyRevoked(address indexed strategy);
    event VaultDeployed(address indexed vault, address indexed asset, address indexed owner);

    constructor(address owner_) Ownable(owner_) {}

    // ---------------------------------------------------------------------
    // Strategy registry management
    // ---------------------------------------------------------------------
    function approveStrategy(address strategy) external onlyOwner {
        require(strategy != address(0), "VaultFactory: zero address");
        require(!isApprovedStrategy[strategy], "VaultFactory: already approved");
        isApprovedStrategy[strategy] = true;
        approvedStrategiesList.push(strategy);
        emit StrategyApproved(strategy);
    }

    function revokeStrategy(address strategy) external onlyOwner {
        require(isApprovedStrategy[strategy], "VaultFactory: not approved");
        isApprovedStrategy[strategy] = false;
        emit StrategyRevoked(strategy);
    }

    function approvedStrategies() external view returns (address[] memory) {
        return approvedStrategiesList;
    }

    // ---------------------------------------------------------------------
    // Vault deployment
    // ---------------------------------------------------------------------
    function deployVault(
        IERC20 asset,
        string calldata name,
        string calldata symbol,
        address vaultOwner,
        address[] calldata selectedStrategies,
        uint8 initialLiquidityBuffer
    ) external onlyOwner returns (ManagedVault vault) {
        require(vaultOwner != address(0), "VaultFactory: zero owner");
        require(selectedStrategies.length > 0, "VaultFactory: no strategies selected");
        require(initialLiquidityBuffer <= 100, "VaultFactory: invalid buffer");

        // Validate each selected strategy is globally approved
        for (uint256 i = 0; i < selectedStrategies.length; ++i) {
            require(isApprovedStrategy[selectedStrategies[i]], "unapproved strategy");
        }

        vault = new ManagedVault(
            asset,
            name,
            symbol,
            vaultOwner,
            selectedStrategies,
            initialLiquidityBuffer
        );

        allVaults.push(address(vault));
        ownerVaults[vaultOwner].push(address(vault));
        vaultOwners[address(vault)] = vaultOwner;
        emit VaultDeployed(address(vault), address(asset), vaultOwner);
    }

    // ---------------------------------------------------------------------
    // View helpers
    // ---------------------------------------------------------------------
    function allVaultsLength() external view returns (uint256) {
        return allVaults.length;
    }

    function getAllVaults() external view returns (address[] memory) {
        return allVaults;
    }

    function getVaultsByOwner(address owner) external view returns (address[] memory) {
        return ownerVaults[owner];
    }

    function getVaultOwner(address vault) external view returns (address) {
        return vaultOwners[vault];
    }
}
