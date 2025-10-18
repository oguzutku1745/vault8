// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ManagedVault.sol";

contract VaultFactory {
    // List of all vaults deployed by this factory
    address[] public allVaults;

    // Event emitted when a new vault is created
    event VaultCreated(address indexed vault, address indexed owner, address indexed token);

    /// @notice Deploy a new ManagedVault
    /// @param token The ERC20 token the vault will hold
    /// @param name The name of the vault token
    /// @param symbol The symbol of the vault token
    /// @return vaultAddress The address of the newly deployed vault
    function deployVault(
        address token,
        string memory name,
        string memory symbol
    ) external returns (address vaultAddress) {
        // Deploy a new ManagedVault instance with the caller as owner
        ManagedVault vault = new ManagedVault(IERC20(token), name, symbol, msg.sender);

        // Store the deployed vault address
        allVaults.push(address(vault));

        // Emit event
        emit VaultCreated(address(vault), msg.sender, token);

        return address(vault);
    }

    /// @notice Return total number of vaults deployed
    function vaultCount() external view returns (uint256) {
        return allVaults.length;
    }
}
