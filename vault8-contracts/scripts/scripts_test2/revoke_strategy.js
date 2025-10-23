/**
 * Revoke an approved strategy on a deployed VaultFactory.
 *
 * Usage:
 *   FACTORY=0xFactoryAddress STRATEGY=0xStrategyAddress pnpm exec hardhat run scripts/revoke_strategy.js --network <network>
 *
 * The caller must be the factory owner (use the PRIVATE_KEY in your hardhat config / .env).
 */
const hre = require("hardhat");

async function main() {
  const { ethers } = hre;
  const FACTORY = process.env.FACTORY_ADDRESS;
  const STRATEGY = "0xaac4eFfEc86ED8397365807139deA3C87b8856a3";

  if (!FACTORY || !STRATEGY) {
    console.error("Missing FACTORY or STRATEGY env var.");
    console.error("Example:");
    console.error("  FACTORY=0x... STRATEGY=0x... pnpm exec hardhat run scripts/revoke_strategy.js --network sepolia");
    process.exit(1);
  }

  const [caller] = await ethers.getSigners();
  console.log("Caller:", caller.address);

  const factory = await ethers.getContractAt("VaultFactory", FACTORY, caller);

  const currentlyApproved = await factory.isApprovedStrategy(STRATEGY);
  console.log("Currently approved:", currentlyApproved);

  if (!currentlyApproved) {
    console.log("Strategy is not approved (nothing to revoke).");
    return;
  }

  const tx = await factory.revokeStrategy(STRATEGY);
  console.log("Sent revoke tx:", tx.hash);
  await tx.wait();
  console.log("Strategy revoked:", STRATEGY);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});