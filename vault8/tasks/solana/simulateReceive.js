"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_path_1 = __importDefault(require("node:path"));
const node_fs_1 = __importDefault(require("node:fs"));
const web3_js_1 = require("@solana/web3.js");
const anchor = __importStar(require("@coral-xyz/anchor"));
const config_1 = require("hardhat/config");
const index_1 = require("./index");
// Helper: hex string to 32-byte Buffer
function hex32(hex) {
    const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
    const buf = Buffer.from(clean, 'hex');
    if (buf.length !== 32)
        throw new Error(`guid must be 32 bytes, got ${buf.length}`);
    return buf;
}
// Helper: read IDL and program
function loadProgram(connection, programId, wallet) {
    const idlPath = node_path_1.default.resolve('target', 'idl', 'my_oapp.json');
    if (!node_fs_1.default.existsSync(idlPath))
        throw new Error(`IDL not found at ${idlPath}. Build first.`);
    const idl = JSON.parse(node_fs_1.default.readFileSync(idlPath, 'utf8'));
    const provider = new anchor.AnchorProvider(connection, wallet, {});
    anchor.setProvider(provider);
    const program = new anchor.Program(idl, programId, provider);
    return { program, idl };
}
(0, config_1.task)('lz:oapp:solana:simulate-receive', 'Simulate lz_receive types->receive on devnet (no DVN/Executor)')
    .addParam('eid', 'Solana endpoint id (e.g., 40168 for devnet)', 40168, config_1.types.int)
    .addParam('srcEid', 'Source EID (e.g., 40245 for Base Sepolia)', undefined, config_1.types.int)
    .addParam('nonce', 'Message nonce (decimal string)', undefined, config_1.types.string)
    .addParam('guid', 'Message GUID (32-byte hex)', undefined, config_1.types.string)
    .addParam('amountBaseUnits', 'Amount in base units (fits u64)', '1000000', config_1.types.string)
    .setAction(async ({ eid, srcEid, nonce, guid, amountBaseUnits }, hre) => {
    // 1) Connect
    const deployment = (0, index_1.getSolanaDeployment)(eid);
    const programId = new web3_js_1.PublicKey(deployment.programId);
    const store = new web3_js_1.PublicKey(deployment.oapp);
    const url = 'https://api.devnet.solana.com';
    const connection = new web3_js_1.Connection(url, 'confirmed');
    // wallet from SOLANA_KEYPAIR_PATH (Hardhat tasks already use this in other tasks)
    const keypairPath = process.env.SOLANA_KEYPAIR_PATH || node_path_1.default.join(process.env.HOME || '.', '.config/solana/id.json');
    const secret = JSON.parse(node_fs_1.default.readFileSync(keypairPath, 'utf8'));
    const payer = web3_js_1.Keypair.fromSecretKey(new Uint8Array(secret));
    const wallet = new anchor.Wallet(payer);
    const { program, idl } = loadProgram(connection, programId, wallet);
    // 2) Derive peer PDA and fetch it to get the exact sender bytes32 the program expects
    const peerSeeds = [Buffer.from('Peer'), store.toBuffer(), Buffer.from(new Uint8Array(new Uint32Array([srcEid]).buffer).reverse())];
    // NOTE: Anchor derive in-program uses to_be_bytes; convert u32 -> BE bytes
    const srcEidBe = Buffer.alloc(4);
    srcEidBe.writeUInt32BE(srcEid);
    const [peerPda] = web3_js_1.PublicKey.findProgramAddressSync([Buffer.from('Peer'), store.toBuffer(), srcEidBe], program.programId);
    console.log('Store      :', store.toBase58());
    console.log('Program ID :', programId.toBase58());
    console.log('Peer PDA   :', peerPda.toBase58());
    let peerAccount;
    try {
        // @ts-ignore account name from IDL
        peerAccount = await program.account.peerConfig.fetch(peerPda);
        console.log('Peer found, sender:', Buffer.from(peerAccount.peerAddress).toString('hex').slice(0, 16) + '...');
    }
    catch (e) {
        console.warn('⚠️  PeerConfig not found - using zeros (will fail sender constraint)');
    }
    // 3) Build params matching IDL: srcEid (u32), sender ([u8;32]), nonce (u64), guid ([u8;32]), message (Vec<u8>)
    const amt = BigInt(amountBaseUnits);
    if (amt > (1n << 64n) - 1n)
        throw new Error('amountBaseUnits does not fit into u64');
    // Build message: 8-byte LE amount (Vec<u8> in Rust = Buffer in JS/Anchor)
    const messageBuffer = Buffer.alloc(8);
    messageBuffer.writeBigUInt64LE(amt);
    // For Anchor/Borsh: [u8;32] expects Uint8Array, Vec<u8> expects Buffer
    const guidBytes = hex32(guid);
    const senderBytes = peerAccount?.peerAddress
        ? (Buffer.isBuffer(peerAccount.peerAddress) ? peerAccount.peerAddress : Buffer.from(peerAccount.peerAddress))
        : Buffer.alloc(32);
    const params = {
        srcEid: srcEid,
        sender: senderBytes,
        nonce: new anchor.BN(nonce),
        guid: guidBytes,
        message: messageBuffer,
        extraData: Buffer.alloc(0), // Empty bytes for extraData
    };
    console.log('Simulating lz_receive with amount:', amountBaseUnits, 'base units...\n');
    console.log('⚠️  Skipping lz_receive_types_v2 (return data > 1KB) - using minimal accounts (just clear) for local fast test\n');
    // 4) Manually construct minimal remaining accounts for lz_receive
    // We'll use lz_receive_types (V1) if available, fallback to just peer
    let remaining = [];
    try {
        // Try V1 lz_receive_types - it returns Vec<LzAccount> which fits in return data
        const typesV1 = await program.methods
            .lzReceiveTypes(params)
            .accounts({ store })
            .simulate();
        // Parse Vec<LzAccount> from return data
        if (typesV1?.value?.returnData?.data) {
            const raw = Buffer.from(typesV1.value.returnData.data[0], 'base64');
            const coder = new anchor.BorshCoder(idl);
            const accounts = coder.types.decode('Vec<LzAccount>', raw);
            // First two are store, peer; rest go to remaining
            remaining = accounts.slice(2).map(a => ({
                pubkey: new web3_js_1.PublicKey(a.pubkey),
                isWritable: a.isWritable,
                isSigner: false,
            }));
            console.log('✅ Got', accounts.length, 'accounts from lz_receive_types (V1)\n');
        }
        else {
            console.warn('⚠️  lz_receive_types (V1) returned no data');
            console.warn('Logs:', typesV1?.logs);
        }
    }
    catch (e) {
        console.warn('⚠️  lz_receive_types (V1) failed:');
        if (e?.simulationResponse?.logs) {
            console.warn('Logs:', e.simulationResponse.logs.join('\n'));
        }
        else {
            console.warn(e?.message || e);
        }
        console.warn('Using empty remaining accounts (lz_receive will fail at clear check)\n');
    }
    console.log('Accounts (lz_receive):');
    console.log('- store:', store.toBase58());
    console.log('- peer :', peerPda.toBase58());
    console.log('- remaining (clear accounts):', remaining.length, '\n');
    // 5) Simulate lz_receive itself using these accounts (fast feedback)
    // NOTE: This will fail at JL CPI since we don't include JL accounts, but we can see if Clear works
    try {
        // @ts-ignore anchor method is generated from IDL
        const sim = await program.methods
            .lzReceive(params)
            .accounts({ store, peer: peerPda })
            .remainingAccounts(remaining)
            .simulate();
        console.log('lz_receive simulation logs:');
        console.log(sim?.logs);
    }
    catch (e) {
        console.error('lz_receive simulation failed:');
        console.error(e?.logs || e?.message || e);
    }
});
