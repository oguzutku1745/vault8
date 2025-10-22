#!/bin/bash
# Start CCTP Attestation Bot
#
# Usage: ./bot/start-bot.sh <MYOAPP_ADDRESS>

if [ -z "$1" ]; then
    echo "❌ Error: MYOAPP_ADDRESS required"
    echo "Usage: ./bot/start-bot.sh <MYOAPP_ADDRESS>"
    exit 1
fi

export MYOAPP_ADDRESS=$1

# Check for bot keypair
BOT_KEYPAIR_PATH="./bot/bot-keypair.json"

if [ ! -f "$BOT_KEYPAIR_PATH" ]; then
    echo "❌ Error: Bot keypair not found at $BOT_KEYPAIR_PATH"
    echo ""
    echo "Please run the setup script first:"
    echo "  ./bot/setup-bot-keypair.sh"
    echo ""
    exit 1
fi

# Optional: Set custom RPC endpoints
# export BASE_SEPOLIA_RPC="https://sepolia.base.org"
# export SOLANA_RPC="https://api.devnet.solana.com"

echo "═══════════════════════════════════════════════════"
echo "Starting CCTP Attestation Bot"
echo "═══════════════════════════════════════════════════"
echo "MyOApp Address: $MYOAPP_ADDRESS"
echo "Bot Keypair: $BOT_KEYPAIR_PATH"
echo "Bot Address: $(solana-keygen pubkey $BOT_KEYPAIR_PATH)"
echo ""
echo "The bot will:"
echo "  1. Watch for CCTP deposits on Base Sepolia"
echo "  2. Fetch attestations from Circle Iris API"
echo "  3. Submit attestations to Solana Devnet"
echo ""
echo "Press Ctrl+C to stop"
echo "═══════════════════════════════════════════════════"
echo ""

# Run the bot
node bot/cctp-attestation-bot.js

