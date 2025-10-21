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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var node_fs_1 = __importDefault(require("node:fs"));
var node_path_1 = __importDefault(require("node:path"));
var web3_js_1 = require("@solana/web3.js");
var config_1 = require("hardhat/config");
var anchor = __importStar(require("@coral-xyz/anchor"));
var solana_1 = require("../solana");
function toPubkey(name, v) {
    if (!v)
        throw new Error("Missing or undefined public key field: ".concat(name));
    try {
        return new web3_js_1.PublicKey(v);
    }
    catch (e) {
        throw new Error("Invalid public key for ".concat(name, ": ").concat(v));
    }
}
function deriveStorePda(programId) {
    var pda = web3_js_1.PublicKey.findProgramAddressSync([Buffer.from('Store')], programId)[0];
    return pda;
}
function deriveAta(owner, mint, tokenProgram, associatedTokenProgram) {
    // SPL Associated Token Account PDA seeds: ["ata", owner, token_program, mint]
    var ata = web3_js_1.PublicKey.findProgramAddressSync([Buffer.from('ata'), owner.toBuffer(), tokenProgram.toBuffer(), mint.toBuffer()], associatedTokenProgram)[0];
    return ata;
}
(0, config_1.task)('lz:oapp:solana:set-jl-config', 'Sets Jupiter Lend + SPL config on Store and prints ATAs')
    .addParam('eid', 'Solana endpoint id (e.g., 40168 for devnet)', undefined, config_1.types.int)
    .addParam('jlConfig', 'Path to JSON with JL CPI accounts', undefined, config_1.types.string)
    .addFlag('printOnly', 'Only derive and print ATAs; do not send on-chain transaction')
    .setAction(function (_a, hre_1) { return __awaiter(void 0, [_a, hre_1], void 0, function (_b, hre) {
    var deployment, programId, cfgPath, raw, sysvarIx, jlLendingProgram, jlLiquidityProgram, params, connection, web3JsKeypair, wallet, provider, idlPath, idl, program, store, txSig, usdcAta, fTokenAta;
    var _c;
    var eid = _b.eid, jlConfig = _b.jlConfig, printOnly = _b.printOnly;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                deployment = (0, solana_1.getSolanaDeployment)(eid);
                programId = new web3_js_1.PublicKey(deployment.programId);
                cfgPath = node_path_1.default.resolve(jlConfig);
                if (!node_fs_1.default.existsSync(cfgPath))
                    throw new Error("Config JSON not found at ".concat(cfgPath));
                raw = JSON.parse(node_fs_1.default.readFileSync(cfgPath, 'utf8'));
                sysvarIx = raw.sysvarInstructions || raw.sysvarInstruction || 'Sysvar1nstructions1111111111111111111111111';
                if (!raw.sysvarInstructions && raw.sysvarInstruction) {
                    console.warn('Using sysvarInstruction (singular) from JSON for sysvarInstructions');
                }
                jlLendingProgram = raw.jlLendingProgram || raw.lendingProgram || raw.liquidityProgram;
                jlLiquidityProgram = raw.jlLiquidityProgram || raw.liquidityProgram || raw.lendingProgram;
                if (!raw.jlLendingProgram && !raw.lendingProgram && raw.liquidityProgram) {
                    console.warn('jlLendingProgram not provided; using liquidityProgram as fallback');
                }
                if (!raw.jlLiquidityProgram && raw.lendingProgram && !raw.liquidityProgram) {
                    console.warn('jlLiquidityProgram not provided; using lendingProgram as fallback');
                }
                params = {
                    usdcMint: toPubkey('usdcMint', raw.usdcMint),
                    tokenProgram: toPubkey('tokenProgram', raw.tokenProgram),
                    associatedTokenProgram: toPubkey('associatedTokenProgram', raw.associatedTokenProgram),
                    systemProgram: toPubkey('systemProgram', (_c = raw.systemProgram) !== null && _c !== void 0 ? _c : web3_js_1.SystemProgram.programId.toBase58()),
                    sysvarInstructions: toPubkey('sysvarInstructions', sysvarIx),
                    jlLendingProgram: toPubkey('jlLendingProgram', jlLendingProgram),
                    jlLiquidityProgram: toPubkey('jlLiquidityProgram', jlLiquidityProgram),
                    jlLendingAdmin: toPubkey('jlLendingAdmin', raw.jlLendingAdmin || raw.lendingAdmin),
                    jlLending: toPubkey('jlLending', raw.jlLending || raw.lending),
                    jlFTokenMint: toPubkey('jlFTokenMint', raw.jlFTokenMint || raw.fTokenMint),
                    jlSupplyTokenReservesLiquidity: toPubkey('jlSupplyTokenReservesLiquidity', raw.jlSupplyTokenReservesLiquidity || raw.supplyTokenReservesLiquidity),
                    jlLendingSupplyPositionOnLiquidity: toPubkey('jlLendingSupplyPositionOnLiquidity', raw.jlLendingSupplyPositionOnLiquidity || raw.lendingSupplyPositionOnLiquidity),
                    jlRateModel: toPubkey('jlRateModel', raw.jlRateModel || raw.rateModel),
                    jlVault: toPubkey('jlVault', raw.jlVault || raw.vault),
                    jlLiquidity: toPubkey('jlLiquidity', raw.jlLiquidity || raw.liquidity),
                    jlRewardsRateModel: toPubkey('jlRewardsRateModel', raw.jlRewardsRateModel || raw.rewardsRateModel),
                };
                return [4 /*yield*/, (0, solana_1.deriveConnection)(eid)];
            case 1:
                connection = (_d.sent()).connection;
                return [4 /*yield*/, (0, solana_1.useWeb3Js)()];
            case 2:
                web3JsKeypair = (_d.sent()).web3JsKeypair;
                wallet = new anchor.Wallet(web3JsKeypair);
                provider = new anchor.AnchorProvider(connection, wallet, {});
                anchor.setProvider(provider);
                idlPath = node_path_1.default.resolve('target', 'idl', 'my_oapp.json');
                if (!node_fs_1.default.existsSync(idlPath))
                    throw new Error("IDL not found at ".concat(idlPath, ". Build the program first."));
                idl = JSON.parse(node_fs_1.default.readFileSync(idlPath, 'utf8'));
                program = new anchor.Program(idl, programId, provider);
                store = deriveStorePda(programId);
                console.log('Program ID:', programId.toBase58());
                console.log('Store PDA  :', store.toBase58());
                if (!printOnly) return [3 /*break*/, 3];
                console.log('ℹ️  Print-only mode: skipping on-chain set_jl_config');
                return [3 /*break*/, 5];
            case 3: return [4 /*yield*/, program.methods
                    .setJlConfig(params)
                    .accounts({ store: store, admin: wallet.publicKey })
                    .rpc()];
            case 4:
                txSig = _d.sent();
                console.log('✅ set_jl_config sent. tx =', txSig);
                _d.label = 5;
            case 5:
                usdcAta = deriveAta(store, params.usdcMint, params.tokenProgram, params.associatedTokenProgram);
                fTokenAta = deriveAta(store, params.jlFTokenMint, params.tokenProgram, params.associatedTokenProgram);
                console.log('Store USDC ATA:', usdcAta.toBase58());
                console.log('Store fToken ATA:', fTokenAta.toBase58());
                return [2 /*return*/];
        }
    });
}); });
