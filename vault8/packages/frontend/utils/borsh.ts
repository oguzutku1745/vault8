export function serializeSendParams(
  dstEid: number,
  message: string,
  options: Uint8Array,
  nativeFee: bigint,
  lzTokenFee: bigint
): Buffer {
  // Instruction discriminator for "send"
  const discriminator = Buffer.from([102, 251, 20, 187, 65, 75, 12, 69]);

  // Manual serialization (simpler than Borsh for this case)
  const dstEidBuffer = Buffer.alloc(4);
  dstEidBuffer.writeUInt32LE(dstEid);

  const messageBuffer = Buffer.from(message, "utf8");
  const messageLengthBuffer = Buffer.alloc(4);
  messageLengthBuffer.writeUInt32LE(messageBuffer.length);

  const optionsLengthBuffer = Buffer.alloc(4);
  optionsLengthBuffer.writeUInt32LE(options.length);

  const nativeFeeBuffer = Buffer.alloc(8);
  nativeFeeBuffer.writeBigUInt64LE(nativeFee);

  const lzTokenFeeBuffer = Buffer.alloc(8);
  lzTokenFeeBuffer.writeBigUInt64LE(lzTokenFee);

  return Buffer.concat([
    discriminator,
    dstEidBuffer,
    messageLengthBuffer,
    messageBuffer,
    optionsLengthBuffer,
    Buffer.from(options),
    nativeFeeBuffer,
    lzTokenFeeBuffer,
  ]);
}
