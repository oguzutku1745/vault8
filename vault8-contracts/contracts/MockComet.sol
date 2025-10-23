// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// Minimal mock of Compound's Comet for tests.
/// Supports supply / withdraw (adapter-owned flow) and supplyTo / withdrawFrom (vault-owned flow).
contract MockComet {
    using SafeERC20 for IERC20;

    address public immutable governor;
    address public immutable baseToken;

    // simple accounting: base balances per account
    mapping(address => uint256) internal _balances;

    // operator permissions: account => operator => allowed
    mapping(address => mapping(address => bool)) public isOperator;

    event Supply(address indexed from, address indexed dst, address asset, uint256 amount);
    event Withdraw(address indexed src, address indexed to, address asset, uint256 amount);
    event OperatorSet(address indexed account, address indexed operator, bool allowed);

    constructor(address _governor, address _baseToken) {
        require(_governor != address(0), "gov=0");
        require(_baseToken != address(0), "asset=0");
        governor = _governor;
        baseToken = _baseToken;
    }

    // supply: msg.sender supplies `amount` of baseToken and is credited
    function supply(address asset, uint256 amount) external {
        require(asset == baseToken, "bad asset");
        require(amount > 0, "zero");
        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);
        _balances[msg.sender] += amount;
        emit Supply(msg.sender, msg.sender, asset, amount);
    }

    // supplyTo: msg.sender supplies but credits dst
    function supplyTo(address dst, address asset, uint256 amount) external {
        require(asset == baseToken, "bad asset");
        require(dst != address(0), "dst=0");
        require(amount > 0, "zero");
        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);
        _balances[dst] += amount;
        emit Supply(msg.sender, dst, asset, amount);
    }

    // withdraw: msg.sender withdraws from their own Comet balance to msg.sender
    function withdraw(address asset, uint256 amount) external {
        require(asset == baseToken, "bad asset");
        require(_balances[msg.sender] >= amount, "insufficient");
        _balances[msg.sender] -= amount;
        IERC20(asset).safeTransfer(msg.sender, amount);
        emit Withdraw(msg.sender, msg.sender, asset, amount);
    }

    // withdrawFrom: operator (msg.sender) may pull from src to `to` if allowed
    function withdrawFrom(address src, address to, address asset, uint256 amount) external {
        require(asset == baseToken, "bad asset");
        require(isOperator[src][msg.sender], "not operator");
        require(_balances[src] >= amount, "insufficient");
        _balances[src] -= amount;
        IERC20(asset).safeTransfer(to, amount);
        emit Withdraw(src, to, asset, amount);
    }

    // convenience: set operator for an account (governor only for tests)
    function setOperator(address account, address operator, bool allowed) external {
        require(msg.sender == governor, "only governor");
        isOperator[account][operator] = allowed;
        emit OperatorSet(account, operator, allowed);
    }

    // view helpers
    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }
}