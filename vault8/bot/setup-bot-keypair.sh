#!/bin/bash
# Setup dedicated keypair for CCTP Attestation Bot
#
# This creates a new Solana keypair specifically for the bot
# DO NOT use your personal keypair for the bot!

BOT_KEYPAIR_PATH="./bot/bot-keypair.json"

echo "═══════════════════════════════════════════════════"
echo "CCTP Bot Keypair Setup"
echo "═══════════════════════════════════════════════════"
echo ""

# Check if keypair already exists
if [ -f "$BOT_KEYPAIR_PATH" ]; then
    echo "⚠️  Bot keypair already exists at $BOT_KEYPAIR_PATH"
    echo ""
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 0
    fi
fi

# Generate new keypair
echo "🔑 Generating new Solana keypair for bot..."
solana-keygen new --no-bip39-passphrase --outfile "$BOT_KEYPAIR_PATH" --force

if [ $? -ne 0 ]; then
    echo "❌ Failed to generate keypair"
    exit 1
fi

echo ""
echo "✅ Bot keypair generated successfully!"
echo ""

# Get the public key
BOT_PUBKEY=$(solana-keygen pubkey "$BOT_KEYPAIR_PATH")

echo "═══════════════════════════════════════════════════"
echo "IMPORTANT: Fund Your Bot Wallet"
echo "═══════════════════════════════════════════════════"
echo ""
echo "Bot Address: $BOT_PUBKEY"
echo ""
echo "The bot needs SOL to submit attestations on Solana Devnet."
echo "Estimated cost: ~0.00001 SOL per attestation"
echo ""
echo "📌 TO FUND YOUR BOT:"
echo ""
echo "1. Via Solana CLI:"
echo "   solana airdrop 1 $BOT_PUBKEY --url devnet"
echo ""
echo "2. Via Web Faucet:"
echo "   https://faucet.solana.com/"
echo "   Paste address: $BOT_PUBKEY"
echo ""
echo "3. Transfer from your wallet:"
echo "   solana transfer $BOT_PUBKEY 1 --url devnet"
echo ""
echo "═══════════════════════════════════════════════════"
echo "SECURITY NOTES"
echo "═══════════════════════════════════════════════════"
echo ""
echo "✅ DO:"
echo "   • Add bot/bot-keypair.json to .gitignore"
echo "   • Keep this keypair only on the bot server"
echo "   • Fund it with only the SOL needed for operations"
echo "   • Monitor the balance regularly"
echo ""
echo "❌ DON'T:"
echo "   • Commit bot-keypair.json to git"
echo "   • Use your personal Solana keypair for the bot"
echo "   • Share this keypair file"
echo "   • Fund it with more SOL than necessary"
echo ""
echo "═══════════════════════════════════════════════════"
echo ""
echo "🎉 Setup complete! You can now start the bot with:"
echo "   ./bot/start-bot.sh <MYOAPP_ADDRESS>"
echo ""


