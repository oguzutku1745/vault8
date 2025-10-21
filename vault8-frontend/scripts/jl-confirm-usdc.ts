import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import { writeFile } from "fs/promises";
import {
  getLendingTokens,
  getLendingTokenDetails,
  getDepositContext,
} from "@jup-ag/lend/earn";

// Devnet RPC and USDC mint
const DEVNET_RPC = process.env.SOLANA_DEVNET_RPC || "https://api.devnet.solana.com";
const USDC_DEVNET = new PublicKey(
  "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
);

async function main() {
  const connection = new Connection(DEVNET_RPC, "confirmed");

  console.log("Connecting to:", DEVNET_RPC);
  console.log("USDC (devnet) mint:", USDC_DEVNET.toBase58(), "decimals=6");

  console.log("\nFetching all Jupiter Lend lending tokens on devnet...");
  const tokens = await getLendingTokens({ connection });
  console.log(`Discovered ${tokens} lending tokens`);

  let found = false;
  for (const token of tokens) {
    const details = await getLendingTokenDetails({ lendingToken: token, connection });
    if (details.asset.equals(USDC_DEVNET)) {
      found = true;
      console.log("\n✅ Found USDC pool in Jupiter Lend (devnet)");
      console.log("jlToken address:", details.address.toBase58());
      console.log("asset (underlying):", details.asset.toBase58());
      console.log("decimals:", details.decimals);
      console.log("totalAssets:", details.totalAssets.toString());
      console.log("totalSupply:", details.totalSupply.toString());
      console.log("convertToShares (multiplier):", details.convertToShares.toString());
      console.log("convertToAssets (multiplier):", details.convertToAssets.toString());
      console.log("supplyRate (1e4=100%):", details.supplyRate.toString());

      // Use the actual Store PDA as signer to get correct account derivations
      const STORE_PDA = new PublicKey("D2VC57AUv3pkUqC5bASikaQRDyq1bar1GoCtTQeqDoE2");
      const depositContext = await getDepositContext({
        asset: USDC_DEVNET,
        signer: STORE_PDA,
        connection,
      });

      console.log("\nCPI deposit context accounts (devnet):");
      const ctxAny: Record<string, any> = depositContext as any;
      for (const [k, v] of Object.entries(ctxAny)) {
        if (v && typeof v === "object" && typeof v.toBase58 === "function") {
          console.log(`- ${k}:`, v.toBase58());
        } else {
          // print non-pubkey fields generically
          console.log(`- ${k}:`, v);
        }
      }

      if (process.env.WRITE_JSON === "1") {
        const out: Record<string, string> = {};
        for (const [k, v] of Object.entries(ctxAny)) {
          if (v && typeof v === "object" && typeof (v as any).toBase58 === "function") {
            out[k] = (v as any).toBase58();
          }
        }
        out["usdcMint"] = USDC_DEVNET.toBase58();
        const path = "scripts/jl-context-devnet-usdc.json";
        await writeFile(path, JSON.stringify(out, null, 2), "utf8");
        console.log(`\nWrote context JSON to ${path}`);
      }

      break;
    }
  }

  if (!found) {
    console.error("\n⚠️ USDC devnet mint not found in Jupiter Lend token list on this RPC.");
    console.error("- This may indicate no Earn pools are listed on devnet currently, or the SDK requires different cluster config.");

    // Try to resolve CPI accounts directly; if this works, we can proceed with CPI even if the registry is empty.
    console.log("\nAttempting to resolve CPI deposit context directly for USDC devnet...");
    try {
      const STORE_PDA = new PublicKey("D2VC57AUv3pkUqC5bASikaQRDyq1bar1GoCtTQeqDoE2");
      const depositContext = await getDepositContext({
        asset: USDC_DEVNET,
        signer: STORE_PDA,
        connection,
      });
      console.log("\n✅ Resolved CPI deposit context (despite empty token list)");
      const ctxAny: Record<string, any> = depositContext as any;
      for (const [k, v] of Object.entries(ctxAny)) {
        if (v && typeof v === "object" && typeof v.toBase58 === "function") {
          console.log(`- ${k}:`, v.toBase58());
        } else {
          console.log(`- ${k}:`, v);
        }
      }

      if (process.env.WRITE_JSON === "1") {
        const out: Record<string, string> = {};
        for (const [k, v] of Object.entries(ctxAny)) {
          if (v && typeof v === "object" && typeof (v as any).toBase58 === "function") {
            out[k] = (v as any).toBase58();
          }
        }
        out["usdcMint"] = USDC_DEVNET.toBase58();
        const path = "scripts/jl-context-devnet-usdc.json";
        await writeFile(path, JSON.stringify(out, null, 2), "utf8");
        console.log(`\nWrote context JSON to ${path}`);
      }
    } catch (err) {
      console.error("\n❌ Failed to resolve CPI deposit context for USDC devnet:");
      console.error(err);
      console.error("- Options: confirm if Earn pools are deployed on devnet; consider using published devnet program IDs; or test on mainnet/staging.");
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
