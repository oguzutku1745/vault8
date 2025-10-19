const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("VaultFactory & ManagedVault Integration", function () {
  let deployer, user;
  let mockToken, mockStrategy, factory, managedVault;

  beforeEach(async function () {
    [deployer, user] = await ethers.getSigners();

    // Deploy mock token and mint
    const MockToken = await ethers.getContractFactory("MockERC20");
    mockToken = await MockToken.deploy("MockToken", "MTK");
    await mockToken.mint(deployer.address, ethers.parseUnits("1000", 18));

    // Deploy mock strategy
    const MockStrategy = await ethers.getContractFactory("MockStrategy");
    mockStrategy = await MockStrategy.deploy(mockToken.target);

    const VaultFactory = await ethers.getContractFactory("VaultFactory");
    factory = await VaultFactory.deploy();

    // <-- ensure the strategy is approved before deploying the vault
    await factory.approveStrategy(mockStrategy.target);

    const allowedStrategies = [mockStrategy.target];
    const tx = await factory.deployVault(
      mockToken.target,
      "TestVault",
      "TVLT",
      allowedStrategies
    );
    const receipt = await tx.wait();
    const event = receipt.logs.find(log => log.fragment?.name === "VaultCreated");
    managedVault = await ethers.getContractAt("ManagedVault", event.args.vault);

    // Transfer tokens to vault for testing
    await mockToken.transfer(managedVault.target, ethers.parseUnits("500", 18));
  });

  // -----------------------------------------------------------------------
  // Factory behavior
  // -----------------------------------------------------------------------

  it("deploys a ManagedVault with correct configuration", async function () {
    expect(await managedVault.name()).to.equal("TestVault");
    expect(await managedVault.symbol()).to.equal("TVLT");
    expect(await managedVault.owner()).to.equal(deployer.address);
    expect(await managedVault.asset()).to.equal(mockToken.target);
    expect(await managedVault.isStrategyAllowed(mockStrategy.target)).to.equal(true);
  });

  it("tracks deployed vaults and counts them correctly", async function () {
    expect(await factory.vaultCount()).to.equal(1);
    const firstVault = await factory.allVaults(0);
    expect(firstVault).to.properAddress;
  });

  it("emits VaultCreated event on deployment", async function () {
    const allowedStrategies = [mockStrategy.target];
    const tx = await factory.deployVault(
      mockToken.target, "VaultEvent", "VLT", allowedStrategies
    );
    const receipt = await tx.wait();
    const ev = receipt.logs.find(log => log.fragment?.name === "VaultCreated");

    expect(ev).to.not.be.undefined;
    expect(ev.args.owner).to.equal(deployer.address);
    expect(ev.args.token).to.equal(mockToken.target);
    expect(ev.args.vault).to.properAddress;
  });

  // -----------------------------------------------------------------------
  // Vault whitelist behavior
  // -----------------------------------------------------------------------

  it("stores allowed strategies immutably", async function () {
    expect(await managedVault.isStrategyAllowed(mockStrategy.target)).to.equal(true);
    expect(await managedVault.isStrategyAllowed(user.address)).to.equal(false);
    expect(await managedVault.allowedStrategies()).to.deep.equal([mockStrategy.target]);
  });

  it("reverts allocate and recall if strategy is not allowed", async function () {
    const MockStrategy = await ethers.getContractFactory("MockStrategy");
    const otherStrategy = await MockStrategy.deploy(mockToken.target);

    await expect(
      managedVault.allocate(ethers.parseUnits("1", 18), otherStrategy.target)
    ).to.be.reverted;

    await expect(
      managedVault.recall(ethers.parseUnits("1", 18), otherStrategy.target)
    ).to.be.reverted;
  });

  it("restricts allocate and recall to owner only", async function () {
    await expect(
      managedVault.connect(user).allocate(ethers.parseUnits("1", 18), mockStrategy.target)
    ).to.be.reverted;

    await managedVault.allocate(ethers.parseUnits("50", 18), mockStrategy.target);
    await expect(
      managedVault.connect(user).recall(ethers.parseUnits("10", 18), mockStrategy.target)
    ).to.be.reverted;
  });

  it("reverts constructor on zero-address strategy", async function () {
    const ManagedVault = await ethers.getContractFactory("ManagedVault");
    await expect(
      ManagedVault.deploy(
        mockToken.target,
        "BadVault",
        "BAD",
        deployer.address,
        [ethers.ZeroAddress]
      )
    ).to.be.revertedWith("ManagedVault: zero-strategy");
  });

  // -----------------------------------------------------------------------
  // End-to-end behavior
  // -----------------------------------------------------------------------

  it("enforces whitelist during allocate and recall", async function () {
    const amount = ethers.parseUnits("300", 18);
    const recallAmount = ethers.parseUnits("150", 18);

    await managedVault.allocate(amount, mockStrategy.target);
    expect(await mockStrategy.balance()).to.equal(amount);
    expect(await mockToken.balanceOf(managedVault.target)).to.equal(ethers.parseUnits("200", 18));

    if (mockStrategy.accrueInterest) {
      await mockStrategy.accrueInterest(ethers.parseUnits("50", 18));
      expect(await mockStrategy.balance()).to.equal(ethers.parseUnits("350", 18));
    }

    await managedVault.recall(recallAmount, mockStrategy.target);
    const expectedStrategyBal = mockStrategy.accrueInterest
      ? ethers.parseUnits("200", 18)
      : ethers.parseUnits("150", 18);

    expect(await mockStrategy.balance()).to.equal(expectedStrategyBal);
    expect(await mockToken.balanceOf(managedVault.target)).to.equal(ethers.parseUnits("350", 18));
  });
});
