const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Vault System Integration", function () {
  let deployer, user, mockToken, mockStrategy, factory, managedVault;

  beforeEach(async function () {
    [deployer, user] = await ethers.getSigners();

    // --- Token & Strategy setup ---
    const MockToken = await ethers.getContractFactory("MockERC20");
    mockToken = await MockToken.deploy("MockToken", "MTK");
    await mockToken.mint(deployer.address, ethers.parseUnits("1000", 18));

    const MockStrategy = await ethers.getContractFactory("MockStrategy");
    mockStrategy = await MockStrategy.deploy(mockToken.target);

    // --- Factory deployment & approval ---
    const VaultFactory = await ethers.getContractFactory("VaultFactory");
    factory = await VaultFactory.deploy();
    await factory.approveStrategy(mockStrategy.target);

    // --- Vault deployment ---
    const tx = await factory.deployVault(
      mockToken.target,
      "TestVault",
      "TVLT",
      [mockStrategy.target]
    );
    const receipt = await tx.wait();
    const event = receipt.logs.find(log => log.fragment?.name === "VaultCreated");
    managedVault = await ethers.getContractAt("ManagedVault", event.args.vault);

    // --- Fund vault ---
    await mockToken.transfer(managedVault.target, ethers.parseUnits("500", 18));
  });

  // --------------------------------------------------------------------------
  // Factory behavior
  // --------------------------------------------------------------------------
  it("sets deployer as owner", async () => {
    expect(await factory.owner()).to.equal(deployer.address);
  });

  it("approves strategies and reverts for unapproved ones", async () => {
    const NewStrategy = await ethers.getContractFactory("MockStrategy");
    const s = await NewStrategy.deploy(mockToken.target);

    await expect(factory.approveStrategy(s.target))
      .to.emit(factory, "StrategyApproved")
      .withArgs(s.target);

    await expect(
      factory.deployVault(mockToken.target, "BadVault", "BAD", [ethers.ZeroAddress])
    ).to.be.revertedWith("VaultFactory: unapproved strategy");
  });

  it("records all deployed vaults", async () => {
    expect(await factory.vaultCount()).to.equal(1);
    expect(await factory.allVaults(0)).to.properAddress;
  });

  // --------------------------------------------------------------------------
  // Vault configuration & permissions
  // --------------------------------------------------------------------------
  it("initializes ManagedVault correctly", async () => {
    expect(await managedVault.name()).to.equal("TestVault");
    expect(await managedVault.symbol()).to.equal("TVLT");
    expect(await managedVault.owner()).to.equal(deployer.address);
    expect(await managedVault.asset()).to.equal(mockToken.target);
    expect(await managedVault.isStrategyAllowed(mockStrategy.target)).to.be.true;
  });

  it("restricts allocate and recall to owner only", async () => {
    await expect(
      managedVault.connect(user).allocate(ethers.parseUnits("1", 18), mockStrategy)
    ).to.be.reverted;

    await managedVault.allocate(ethers.parseUnits("50", 18), mockStrategy);

    await expect(
      managedVault.connect(user).recall(ethers.parseUnits("10", 18), mockStrategy)
    ).to.be.reverted;
  });

  // --------------------------------------------------------------------------
  // Vault functional behavior
  // --------------------------------------------------------------------------
  it("allocates and recalls funds properly", async () => {
    await managedVault.allocate(ethers.parseUnits("300", 18), mockStrategy);
    expect(await mockStrategy.balance()).to.equal(ethers.parseUnits("300", 18));

    await managedVault.recall(ethers.parseUnits("150", 18), mockStrategy);
    expect(await mockStrategy.balance()).to.equal(ethers.parseUnits("150", 18));
  });

  it("keeps internal and external accounting consistent", async () => {
    await managedVault.allocate(ethers.parseUnits("200", 18), mockStrategy);
    await managedVault.syncInvestedAssets();
    expect(await managedVault.totalAllocation()).to.equal(ethers.parseUnits("200", 18));
  });
});
