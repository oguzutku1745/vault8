const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SimpleVault", function () {
  let token, vault, owner, user;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();

    // Deploy mock ERC20 token
    const Token = await ethers.getContractFactory("MockERC20");
    token = await Token.deploy("MockToken", "MTK");

    // Mint tokens to user
    await token.mint(user.address, ethers.parseEther("1000"));

    // Deploy SimpleVault
    const Vault = await ethers.getContractFactory("SimpleVault");
    vault = await Vault.deploy(token.target, "VaultToken", "vMTK");
  });

  it("allows deposit and withdraw", async function () {
    // user approves vault
    await token.connect(user).approve(vault.target, ethers.parseEther("500"));

    // deposit
    await vault.connect(user).deposit(ethers.parseEther("500"), user.address);
    expect(await vault.balanceOf(user.address)).to.equal(ethers.parseEther("500"));

    // withdraw
    await vault.connect(user).withdraw(ethers.parseEther("500"), user.address, user.address);
    expect(await vault.balanceOf(user.address)).to.equal(0);
    expect(await token.balanceOf(user.address)).to.equal(ethers.parseEther("1000"));
  });
});
