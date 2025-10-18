// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// Minimal ERC4626 vault wrapping an existing ERC20 asset
contract SimpleVault is ERC4626 {
    constructor(
        IERC20 asset,       // the token this vault accepts
        string memory name, // vault token name
        string memory symbol // vault token symbol
    ) ERC20(name, symbol) ERC4626(asset) {}
}