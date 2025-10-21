const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ManagedVault with ERC4626Mock via Stateless Adapter", function () {
  let deployer, user;
  let mockToken, erc4626Vault, adapter, factory, managedVault;

  beforeEach(async function () {
    [deployer, user] = await ethers.getSigners();

    // 1️⃣ Deploy mock ERC20 asset
    const MockToken = await ethers.getContractFactory("MockERC20");
    mockToken = await MockToken.deploy("MockToken", "MTK");
    await mockToken.mint(deployer.address, ethers.parseUnits("1000", 18));

    // 2️⃣ Deploy ERC4626 vault that will act as the yield strategy
    const ERC4626Mock = await ethers.getContractFactory("MockERC4626");
    erc4626Vault = await ERC4626Mock.deploy(mockToken.target, "YieldVault", "YVLT");

    // 3️⃣ Deploy the stateless adapter (only needs ERC4626 target)
    const Adapter = await ethers.getContractFactory("StrategyAdapter4626");
    adapter = await Adapter.deploy(erc4626Vault.target);

    // 4️⃣ Deploy factory and approve adapter
    const VaultFactory = await ethers.getContractFactory("VaultFactory");
    factory = await VaultFactory.deploy(deployer.address);
    await factory.approveStrategy(adapter.target);

    // 5️⃣ Deploy ManagedVault with adapter in whitelist
    const tx = await factory.deployVault(
      mockToken.target,
      "ParentVault",
      "PVLT",
      deployer.address,
      [adapter.target]
    );
    const receipt = await tx.wait();
    const ev = receipt.logs.find((log) => log.fragment?.name === "VaultDeployed");
    managedVault = await ethers.getContractAt("ManagedVault", ev.args.vault);

    // 6️⃣ Fund vault with base assets
    await mockToken.transfer(managedVault.target, ethers.parseUnits("500", 18));
  });

  it("allocates and recalls funds through the ERC4626 adapter", async () => {
    const amount = ethers.parseUnits("300", 18);
    const recallAmount = ethers.parseUnits("150", 18);

    // Allocate funds from ManagedVault to ERC4626 vault via adapter
    await managedVault.allocate(amount, adapter.target);

    // ERC4626 vault should now hold the deposited amount
    expect(await erc4626Vault.totalAssets()).to.equal(amount);
    expect(await mockToken.balanceOf(managedVault.target)).to.equal(
      ethers.parseUnits("200", 18)
    );

    // Recall part of the funds
    await managedVault.recall(recallAmount, adapter.target);

    // Balances should reflect recall
    expect(await erc4626Vault.totalAssets()).to.equal(amount - recallAmount);
    expect(await mockToken.balanceOf(managedVault.target)).to.equal(
      ethers.parseUnits("350", 18)
    );
  });
});
