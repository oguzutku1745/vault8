"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSimpleOAppFactory = void 0;
const p_memoize_1 = __importDefault(require("p-memoize"));
const devtools_solana_1 = require("@layerzerolabs/devtools-solana");
const sdk_1 = require("./sdk");
/**
 * Syntactic sugar that creates an instance of Solana `OApp` SDK
 * based on an `OmniPoint` with help of an `ConnectionFactory`
 * and a `PublicKeyFactory`
 *
 * @param {PublicKeyFactory} userAccountFactory A function that accepts an `OmniPoint` representing an OApp and returns the user wallet public key
 * @param {ConnectionFactory} connectionFactory A function that returns a `Connection` based on an `EndpointId`
 * @returns {OAppFactory<CustomOAppSDK>}
 */
const createSimpleOAppFactory = (userAccountFactory, programIdFactory, connectionFactory = (0, devtools_solana_1.createConnectionFactory)(devtools_solana_1.defaultRpcUrlFactory)) => (0, p_memoize_1.default)(async (point) => new sdk_1.CustomOAppSDK(await connectionFactory(point.eid), point, await userAccountFactory(point), await programIdFactory(point)));
exports.createSimpleOAppFactory = createSimpleOAppFactory;
