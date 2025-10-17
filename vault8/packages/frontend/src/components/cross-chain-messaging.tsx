import React, { useState } from "react";
console.debug('[frontend] cross-chain-messaging.tsx loaded')
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import {
  Connection,
  PublicKey,
} from "@solana/web3.js";
import type { Provider } from "@reown/appkit-adapter-solana/react";
// defer heavy Umi imports until runtime (on user action) to avoid pulling node-only modules during initial app boot
// Defer importing the generated MyOApp until the user triggers sending (to avoid pulling node-only deps at module load)
import { Options } from "@layerzerolabs/lz-v2-utilities";
import bs58 from 'bs58'
import makeUmiSignerFromAppKit from '../adapters/umiAppKitSigner'

class ErrorBoundary extends React.Component<any, any> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error }
  }
  componentDidCatch(error: any, info: any) {
    console.error('ErrorBoundary caught:', error, info)
  }
  render() {
    if (this.state.hasError) {
      return <div style={{ padding: 20, color: 'red' }}>An error occurred: {String(this.state.error)}</div>
    }
    return this.props.children
  }
}

const CrossChainMessaging = () => {
  const { address, isConnected } = useAppKitAccount({ namespace: "solana" });
  const { walletProvider } = useAppKitProvider<Provider>("solana");
  const [message, setMessage] = useState("Hello from Vault8!");
  const [isSending, setIsSending] = useState(false);

  // LayerZero Configuration
  const OAPP_ADDRESS = "6ohio4jqoUPAisLogy1tk9ffreucCr6uW45T1sapyQMm";
  const DST_EID = 40245; // Base Sepolia

  const handleSendMessage = async () => {
    if (!isConnected || !address) {
      alert("Please connect your Solana wallet first");
      return;
    }
    setIsSending(true);
    try {
      const walletPubkey = new PublicKey(address);
      const connection = new Connection(
        "https://api.devnet.solana.com",
        "confirmed"
      );

      console.log("📍 Initializing LayerZero SDK...");
      
      // Dynamically import Umi + adapters to avoid loading heavy/node-bound modules at app startup
      const [{ createUmi }, { publicKey, transactionBuilder }, { fromWeb3JsPublicKey, toWeb3JsTransaction }, MyOAppModule] = await Promise.all([
        import('@metaplex-foundation/umi-bundle-defaults'),
        import('@metaplex-foundation/umi'),
        import('@metaplex-foundation/umi-web3js-adapters'),
        // Import the TypeScript source explicitly so Vite uses the ESM/TS module instead of a compiled
        // CommonJS `.js` that references `exports` (which is undefined in the browser).
        import('../../lib/client/myoapp.ts'),
      ])

      // Create Umi instance using bundle defaults (provides rpc/web3js adapters)
      const umi = createUmi("https://api.devnet.solana.com")

      // Get program ID from deployment
      const programId = publicKey("GJ5LvF5nCn29geYFTQUW75dMS2UXQKHYVRtKDsTwA8SX")

      // Create MyOApp instance (imported as namespace because the generated file is CommonJS)
      const myOApp = new MyOAppModule.MyOApp(programId)
      
      console.log("📍 Quoting fee...");
      
      // Prepare options (empty, relying on enforced options)
      const options = Options.newOptions().toBytes();
      
      // Convert wallet pubkey to Umi format
      const umiWalletPubkey = fromWeb3JsPublicKey(walletPubkey);

      // If a walletProvider is available, create a Umi signer adapter and register it
      try {
        if (walletProvider) {
          const { identity } = makeUmiSignerFromAppKit(walletProvider, umiWalletPubkey)
          umi.use(identity)
          console.log('✅ Umi identity attached via AppKit signer')
        }
      } catch (attachErr) {
        console.warn('Failed to attach umi signer identity, will fallback to manual signing', attachErr)
      }
      
      // Quote the fee
      const { nativeFee } = await myOApp.quote(umi.rpc, umiWalletPubkey, {
        dstEid: DST_EID,
        message,
        options,
        payInLzToken: false,
      });
      
      console.log("📍 Native fee quoted:", nativeFee.toString(), "lamports");
      
      console.log("📍 Building send instruction...");
      
      // Build send instruction
      const sendInstruction = await myOApp.send(umi.rpc, umiWalletPubkey, {
        dstEid: DST_EID,
        message,
        options,
        nativeFee,
        lzTokenFee: BigInt(0),
      });
      
      console.log("📍 Building transaction...");
      
      // Build transaction with the instruction
      let txBuilder = transactionBuilder().add(sendInstruction);

      try {
        // Preferred path: let Umi handle signing & sending if possible
        console.log('📡 Attempting umi txBuilder.sendAndConfirm...')
        const tx = await txBuilder.sendAndConfirm(umi)
        // tx.signature is typically a Uint8Array/Buffer
        const txHash = tx.signature ? bs58.encode(Buffer.from(tx.signature)) : undefined
        console.log('✅ Umi sent tx:', tx)
        if (txHash) {
          console.log('🔗 View on Solscan:', `https://solscan.io/tx/${txHash}?cluster=devnet`)
          console.log('🌐 Track on LayerZero Scan:', `https://testnet.layerzeroscan.com/tx/${txHash}`)
          alert(`✅ Message sent successfully!\n\nTX: ${txHash}`)
        } else {
          alert('✅ Message sent (no signature returned by umi)')
        }
      } catch (umiErr) {
        console.warn('umi.sendAndConfirm failed or requires external signer, falling back to walletProvider signing', umiErr)

        // Fallback: convert to web3 transaction and sign via AppKit wallet
        const umiTx = await txBuilder.build(umi)
        const web3Tx: any = toWeb3JsTransaction(umiTx) as any
        web3Tx.feePayer = walletPubkey

        console.log('🚀 Sending via walletProvider.signTransaction...')
        const signedTx = await walletProvider.signTransaction(web3Tx)
        const signature = await connection.sendRawTransaction(signedTx.serialize())
        console.log('✅ Transaction sent:', signature)
        console.log('🔗 View on Solscan:', `https://solscan.io/tx/${signature}?cluster=devnet`)
        console.log('🌐 Track on LayerZero Scan:', `https://testnet.layerzeroscan.com/tx/${signature}`)
        await connection.confirmTransaction(signature, 'confirmed')
        alert(`✅ Message sent successfully!\n\nTX: ${signature}`)
      }
      
  // success already reported in branches above
    } catch (error: any) {
      console.error("❌ Send failed:", error);
      alert(`Failed to send: ${error.message || error}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <ErrorBoundary>
    <section style={{ padding: "20px", border: "1px solid #ddd", borderRadius: "8px", marginTop: "20px" }}>
      <h2>Cross-Chain Messaging</h2>
      <p style={{ fontSize: "14px", color: "#666" }}>
        Send messages from Solana to Base via LayerZero
      </p>

      <div style={{ marginTop: "20px" }}>
        {/* Connection status */}
        {isConnected && address && (
          <div
            style={{
              padding: "12px",
              backgroundColor: "#e3f2fd",
              border: "1px solid #2196f3",
              borderRadius: "6px",
              marginBottom: "16px",
              fontSize: "14px",
            }}
          >
            <strong>💡 Wallet Connected:</strong> {address.slice(0, 8)}...{address.slice(-6)}
          </div>
        )}

        {/* Message input */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", fontWeight: "500", marginBottom: "8px" }}>
            Message to send to Base Sepolia
          </label>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              fontSize: "14px",
            }}
            placeholder="Enter your message"
          />
        </div>

        {/* Chain info */}
        <div style={{ fontSize: "14px", color: "#666", marginBottom: "16px" }}>
          <p><strong>From:</strong> Solana Devnet (EID: 40168)</p>
          <p><strong>To:</strong> Base Sepolia (EID: {DST_EID})</p>
          <p>
            <strong>OApp:</strong> {OAPP_ADDRESS.slice(0, 8)}...{OAPP_ADDRESS.slice(-8)}
          </p>
        </div>

        {/* Send button */}
        <button
          onClick={handleSendMessage}
          disabled={isSending || !isConnected}
          style={{
            padding: "10px 20px",
            backgroundColor: isConnected && !isSending ? "#000" : "#ccc",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: isConnected && !isSending ? "pointer" : "not-allowed",
            fontSize: "16px",
            fontWeight: "500",
          }}
        >
          {isSending ? "Sending..." : "Send to Base Sepolia"}
        </button>

        {/* Warning messages */}
        {!isConnected && (
          <p
            style={{
              marginTop: "16px",
              padding: "12px",
              backgroundColor: "#fff3cd",
              border: "1px solid #ffc107",
              borderRadius: "6px",
              fontSize: "14px",
            }}
          >
            ⚠️ Connect a Solana wallet first using "Open Solana" button above
          </p>
        )}

        <div
          style={{
            marginTop: "16px",
            padding: "12px",
            backgroundColor: "#d4edda",
            border: "1px solid #28a745",
            borderRadius: "6px",
            fontSize: "14px",
            color: "#155724",
          }}
        >
          <strong>✅ Ready:</strong> Using LayerZero SDK for proper account derivation and transaction building.
        </div>
      </div>
    </section>
    </ErrorBoundary>
  );
};

export default CrossChainMessaging;
