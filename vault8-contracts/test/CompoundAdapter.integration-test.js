const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Compound Adapter integration", function () {
  let deployer, user;
  let mockToken, mockComet, erc4626Vault;
  let adapter4626, adapterCompound;
  let factory, managedVault;

  beforeEach(async function () {
    [deployer, user] = await ethers.getSigners();

    // 1) deploy mock ERC20 and mint
    const MockToken = await ethers.getContractFactory("MockERC20");
    mockToken = await MockToken.deploy("MockToken", "MTK");
    await mockToken.mint(deployer.address, ethers.parseUnits("10000", 18));

    // 2) deploy MockComet (governor = deployer)
    const MockComet = await ethers.getContractFactory("MockComet");
    mockComet = await MockComet.deploy(deployer.address, mockToken.target);

    // 3) deploy a mock ERC4626 (used by 4626 adapter)
    const MockERC4626 = await ethers.getContractFactory("MockERC4626");
    erc4626Vault = await MockERC4626.deploy(mockToken.target, "YieldVault", "YVLT");

    // 4) deploy adapters
    const Adapter4626 = await ethers.getContractFactory("StrategyAdapter4626");
    adapter4626 = await Adapter4626.deploy(erc4626Vault.target);

    const AdapterCompound = await ethers.getContractFactory("StrategyAdapterCompoundIII");
    adapterCompound = await AdapterCompound.deploy(mockComet.target, mockToken.target);

    // 5) deploy factory and approve both adapters
    const VaultFactory = await ethers.getContractFactory("VaultFactory");
    factory = await VaultFactory.deploy(deployer.address);

    await factory.approveStrategy(adapter4626.target);
    await factory.approveStrategy(adapterCompound.target);

    // 6) deploy ManagedVault via factory with both adapters allowed
    const tx = await factory.deployVault(
      mockToken.target,
      "ParentVault",
      "PVLT",
      deployer.address,
      [adapter4626.target, adapterCompound.target]
    );
    const receipt = await tx.wait();

    // find VaultDeployed event to get address
    const vaultDeployedLog = receipt.logs
      .map((l) => {
        try {
          return factory.interface.parseLog(l);
        } catch {
          return null;
        }
      })
      .find((parsed) => parsed && parsed.name === "VaultDeployed");
    if (!vaultDeployedLog) throw new Error("VaultDeployed event not found");
    const vaultAddress = vaultDeployedLog.args.vault;

    managedVault = await ethers.getContractAt("ManagedVault", vaultAddress);

    // 7) fund the ManagedVault with base tokens
    await mockToken.transfer(managedVault.target, ethers.parseUnits("2000", 18));
  });

  it("allocates and recalls with Compound adapter (and simple 4626 allocate)", async function () {
    const compoundAmount = ethers.parseUnits("150", 18);
    const v4626Amount = ethers.parseUnits("100", 18);

    // --- sanity allocate to ERC4626 adapter (should not revert) ---
    await expect(managedVault.allocate(v4626Amount, adapter4626.target)).to.not.be.reverted;

    // --- allocate to Compound adapter ---
    // ManagedVault.allocate will approve adapter and call deposit
    await managedVault.allocate(compoundAmount, adapterCompound.target);

    // MockComet should now show adapter as credited with the supply
    expect(await mockComet.balanceOf(adapterCompound.target)).to.equal(compoundAmount);

    // adapter's on-chain token balance should be zero (comet pulled tokens)
    expect(await mockToken.balanceOf(adapterCompound.target)).to.equal(0);

    // Now recall: call vault.recall(amount, strategy)
    await managedVault.recall(compoundAmount, adapterCompound.target);

    // After recall, Comet adapter balance should be reduced and vault should hold tokens again
    expect(await mockComet.balanceOf(adapterCompound.target)).to.equal(0);

    // allocate->recall for compound is net-zero, only the ERC4626 allocate removed v4626Amount
    const initial = ethers.parseUnits("2000", 18);
    const expected = initial - v4626Amount;
    expect(await mockToken.balanceOf(managedVault.target)).to.equal(expected);
  });
});