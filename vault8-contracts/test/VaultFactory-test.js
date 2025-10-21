const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("VaultFactory & ManagedVault Integration", function () {
  let deployer, user;
  let mockToken, mockStrategy, factory, managedVault;

  beforeEach(async function () {
    [deployer, user] = await ethers.getSigners();

    const MockToken = await ethers.getContractFactory("MockERC20");
    mockToken = await MockToken.deploy("MockToken", "MTK");
    await mockToken.mint(deployer.address, ethers.parseUnits("1000", 18));

    const MockStrategy = await ethers.getContractFactory("MockStrategy");
    mockStrategy = await MockStrategy.deploy(mockToken.target);

    const VaultFactory = await ethers.getContractFactory("VaultFactory");
    factory = await VaultFactory.deploy(deployer.address);
    await factory.approveStrategy(mockStrategy.target);

    const tx = await factory.deployVault(
      mockToken.target,
      "TestVault",
      "TVLT",
      deployer.address,
      [mockStrategy.target]
    );
    const receipt = await tx.wait();
    const event = receipt.logs.find(log => log.fragment?.name === "VaultDeployed");
    managedVault = await ethers.getContractAt("ManagedVault", event.args.vault);

    await mockToken.transfer(managedVault.target, ethers.parseUnits("500", 18));
  });

  it("deploys a ManagedVault with correct configuration", async () => {
    expect(await managedVault.name()).to.equal("TestVault");
    expect(await managedVault.symbol()).to.equal("TVLT");
    expect(await managedVault.owner()).to.equal(deployer.address);
    expect(await managedVault.asset()).to.equal(mockToken.target);
    expect(await managedVault.isStrategyAllowed(mockStrategy.target)).to.be.true;
  });

  it("tracks deployed vaults and counts them correctly", async () => {
    expect(await factory.allVaultsLength()).to.equal(1n);
    const firstVault = await factory.allVaults(0);
    expect(firstVault).to.properAddress;
  });

  it("emits VaultDeployed event on deployment", async () => {
    const tx = await factory.deployVault(
      mockToken.target,
      "VaultEvent",
      "VLT",
      deployer.address,
      [mockStrategy.target]
    );
    const receipt = await tx.wait();
    const ev = receipt.logs.find(log => log.fragment?.name === "VaultDeployed");

    expect(ev).to.not.be.undefined;
    expect(ev.args.owner).to.equal(deployer.address);
    expect(ev.args.asset).to.equal(mockToken.target);
    expect(ev.args.vault).to.properAddress;
  });

  it("stores allowed strategies immutably", async () => {
    expect(await managedVault.isStrategyAllowed(mockStrategy.target)).to.be.true;
    expect(await managedVault.isStrategyAllowed(user.address)).to.be.false;
    expect(await managedVault.allowedStrategies()).to.deep.equal([mockStrategy.target]);
  });

  it("reverts allocate and recall if strategy is not allowed", async () => {
    const MockStrategy = await ethers.getContractFactory("MockStrategy");
    const otherStrategy = await MockStrategy.deploy(mockToken.target);

    await expect(
      managedVault.allocate(ethers.parseUnits("1", 18), otherStrategy.target)
    ).to.be.reverted;

    await expect(
      managedVault.recall(ethers.parseUnits("1", 18), otherStrategy.target)
    ).to.be.reverted;
  });

  it("restricts allocate and recall to owner only", async () => {
    await expect(
      managedVault.connect(user).allocate(ethers.parseUnits("1", 18), mockStrategy.target)
    ).to.be.reverted;

    await managedVault.allocate(ethers.parseUnits("50", 18), mockStrategy.target);
    await expect(
      managedVault.connect(user).recall(ethers.parseUnits("10", 18), mockStrategy.target)
    ).to.be.reverted;
  });

  it("reverts constructor on zero-address strategy", async () => {
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

  it("enforces whitelist during allocate and recall", async () => {
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
