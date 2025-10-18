const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ManagedVault", function () {
  let deployer, user;
  let mockToken, managedVault, mockStrategy;

  beforeEach(async function () {
    [deployer, user] = await ethers.getSigners();

    // Deploy mock token
    const MockToken = await ethers.getContractFactory("MockERC20");
    mockToken = await MockToken.deploy("MockToken", "MTK");
    await mockToken.mint(deployer.address, ethers.parseUnits("1000", 18));
    expect(await mockToken.totalSupply()).to.equal(ethers.parseUnits("1000", 18));

    // Deploy mock strategy
    const MockStrategy = await ethers.getContractFactory("MockStrategy");
    mockStrategy = await MockStrategy.deploy(mockToken.target);
    expect(await mockStrategy.balance()).to.equal(0);

   // Deploy managed vault with updated constructor
    const ManagedVault = await ethers.getContractFactory("ManagedVault");
    const allowedStrategies = [mockStrategy.target];

    managedVault = await ManagedVault.deploy(
        mockToken.target,          // underlying ERC20 token
        "TestVault",               // vault ERC20 name
        "TVLT",                    // vault ERC20 symbol
        deployer.address,           // owner
        allowedStrategies     // immutable whitelist
    );

    expect(await managedVault.totalAssets()).to.equal(0);

    // Transfer tokens to the vault
    await mockToken.transfer(managedVault.target, ethers.parseUnits("500", 18));
    expect(await mockToken.balanceOf(managedVault.target)).to.equal(ethers.parseUnits("500", 18));
  });

  it("allows owner to allocate and recall funds", async function () {
    // Allocate 300 tokens to strategy
    await managedVault.allocate(ethers.parseUnits("300", 18), mockStrategy);
    expect(await mockStrategy.balance()).to.equal(ethers.parseUnits("300", 18));
    expect(await mockToken.balanceOf(managedVault.target)).to.equal(ethers.parseUnits("200", 18));
    expect(await managedVault.totalAssets()).to.equal(ethers.parseUnits("500", 18));

    // Recall 150 tokens from strategy
    await managedVault.recall(ethers.parseUnits("150", 18), mockStrategy);
    expect(await mockStrategy.balance()).to.equal(ethers.parseUnits("150", 18));
    expect(await mockToken.balanceOf(managedVault.target)).to.equal(ethers.parseUnits("350", 18));
    expect(await managedVault.totalAssets()).to.equal(ethers.parseUnits("500", 18));
  });
});
