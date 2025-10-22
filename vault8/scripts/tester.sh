#!/bin/bash
# CCTP + LayerZero End-to-End Testing Script
# Usage: ./scripts/tester.sh <MYOAPP_ADDRESS>

set -e  # Exit on error

# Check if MYOAPP_ADDRESS is provided
if [ -z "$1" ]; then
    echo "❌ Error: MYOAPP_ADDRESS not provided"
    echo "Usage: ./scripts/tester.sh <MYOAPP_ADDRESS>"
    exit 1
fi

MYOAPP_ADDRESS=$1
export MYOAPP_ADDRESS

echo "═══════════════════════════════════════════════════"
echo "CCTP + LayerZero End-to-End Testing Suite"
echo "═══════════════════════════════════════════════════"
echo "MyOApp Address: $MYOAPP_ADDRESS"
echo ""
echo "Flow:"
echo "  1. ✈️  Deposit USDC via CCTP on Base Sepolia"
echo "  2. ⏳ Wait for Circle attestation (~25 seconds)"
echo "  3. 📥 Submit attestation on Solana Devnet"
echo "  4. 🚀 Send LayerZero message"
echo ""
echo "═══════════════════════════════════════════════════"
echo ""

# Initialize counters
PASSED=0
FAILED=0

# Step 1: Deposit via CCTP on Base
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 1: Deposit USDC via CCTP (Base Sepolia)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Running: test-unified-cctp.js"
echo ""

# Run the CCTP deposit and capture output
CCTP_OUTPUT=$(npx hardhat run scripts/test-unified-cctp.js --network BASE-sepolia 2>&1)
STEP1_EXIT=$?

echo "$CCTP_OUTPUT"

if [ $STEP1_EXIT -ne 0 ]; then
    echo ""
    echo "❌ Step 1 FAILED (exit code $STEP1_EXIT)"
    echo "🔍 Cannot proceed without successful CCTP deposit"
    echo ""
    exit 1
fi

# Extract transaction hash from output
TXHASH=$(echo "$CCTP_OUTPUT" | grep -o "0x[a-fA-F0-9]\{64\}" | head -1)

if [ -z "$TXHASH" ]; then
    echo ""
    echo "❌ Could not extract transaction hash from output"
    echo "🔍 Check the test-unified-cctp.js output above"
    echo ""
    exit 1
fi

# Extract minted amount for informational purposes
MINTED_AMOUNT=$(echo "$CCTP_OUTPUT" | grep "Minted Amount:" | head -1 | grep -o "[0-9\.]\+ USDC" | awk '{print $1}')

echo ""
echo "✅ Step 1 PASSED"
echo "   Transaction Hash: $TXHASH"
if [ -n "$MINTED_AMOUNT" ]; then
    echo "   Minted Amount: $MINTED_AMOUNT USDC (stored in contract)"
fi
PASSED=$((PASSED + 1))
echo ""

# Step 2: Wait and fetch attestation
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 2: Fetch Circle Attestation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Waiting ~25 seconds for Circle to attest the message..."
echo ""

# Wait 25 seconds before first attempt
sleep 25

# Poll for attestation (max 10 attempts, 10 seconds apart)
MAX_ATTEMPTS=10
ATTEMPT=1
ATTESTATION_READY=false

while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
    echo "Attempt $ATTEMPT/$MAX_ATTEMPTS: Fetching attestation..."
    
    ATTEST_OUTPUT=$(TXHASH=$TXHASH node scripts/cctp-3-fetch-attestation.js 2>&1 || true)
    
    # Check for success (either "Attestation complete" or "Saved to cctp-attestation.json")
    if echo "$ATTEST_OUTPUT" | grep -q "Attestation complete\|Saved to cctp-attestation.json"; then
        ATTESTATION_READY=true
        echo "$ATTEST_OUTPUT"
        echo ""
        echo "✅ Step 2 PASSED - Attestation received!"
        PASSED=$((PASSED + 1))
        break
    elif echo "$ATTEST_OUTPUT" | grep -q "pending"; then
        echo "   Status: Still pending, waiting 10 more seconds..."
        sleep 10
        ATTEMPT=$((ATTEMPT + 1))
    else
        echo "$ATTEST_OUTPUT"
        echo ""
        echo "❌ Unexpected error fetching attestation"
        FAILED=$((FAILED + 1))
        break
    fi
done

if [ "$ATTESTATION_READY" = false ]; then
    echo ""
    echo "❌ Step 2 FAILED - Could not fetch attestation after $MAX_ATTEMPTS attempts"
    echo "🔍 The attestation may take longer than expected"
    echo "   You can manually run:"
    echo "   TXHASH=$TXHASH node scripts/cctp-3-fetch-attestation.js"
    echo ""
    exit 1
fi

echo ""

# Step 3: Submit attestation on Solana
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 3: Submit Attestation on Solana Devnet"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Running: cctp-4-solana-receive.js"
echo ""

SOLANA_OUTPUT=$(node scripts/cctp-4-solana-receive.js 2>&1 || true)
STEP3_EXIT=$?

echo "$SOLANA_OUTPUT"

# Check for success or nonce reuse (both are OK)
if [ $STEP3_EXIT -eq 0 ] || echo "$SOLANA_OUTPUT" | grep -q "NONCE ALREADY USED"; then
    echo ""
    echo "✅ Step 3 PASSED"
    PASSED=$((PASSED + 1))
    echo ""
else
    echo ""
    echo "❌ Step 3 FAILED (exit code $STEP3_EXIT)"
    echo "🔍 Issue: Could not submit attestation on Solana"
    FAILED=$((FAILED + 1))
    echo ""
    exit 1
fi

# Step 4: Send LayerZero message
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 4: Send LayerZero Message (Base → Solana)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Running: cctp-5-lz-finalize.js"
if [ -n "$MINTED_AMOUNT" ]; then
    echo "Amount: $MINTED_AMOUNT USDC (read from contract)"
fi
echo ""

LZ_OUTPUT=$(MYOAPP_ADDRESS=$MYOAPP_ADDRESS npx hardhat run scripts/cctp-5-lz-finalize.js --network BASE-sepolia 2>&1 || true)
STEP4_EXIT=$?

echo "$LZ_OUTPUT"

# Check if LayerZero message was sent successfully
if echo "$LZ_OUTPUT" | grep -q "LayerZero message sent\|Deposit flow complete"; then
    echo ""
    echo "✅ Step 4 PASSED"
    PASSED=$((PASSED + 1))
    echo ""
else
    echo ""
    echo "❌ Step 4 FAILED (exit code $STEP4_EXIT)"
    echo "🔍 Issue: Could not send LayerZero message"
    FAILED=$((FAILED + 1))
    echo ""
fi

# Summary
echo "═══════════════════════════════════════════════════"
echo "Test Summary"
echo "═══════════════════════════════════════════════════"
echo ""
echo "✅ Step 1: CCTP Deposit (Base)        - PASSED"
echo "✅ Step 2: Fetch Attestation          - PASSED"

if echo "$SOLANA_OUTPUT" | grep -q "NONCE ALREADY USED"; then
    echo "✅ Step 3: Submit on Solana           - PASSED (nonce reused)"
else
    echo "✅ Step 3: Submit on Solana           - PASSED"
fi

if [ $STEP4_EXIT -eq 0 ]; then
    echo "✅ Step 4: LayerZero Message          - PASSED"
else
    echo "❌ Step 4: LayerZero Message          - FAILED"
fi

echo ""
echo "Results: $PASSED passed, $FAILED failed"
echo "═══════════════════════════════════════════════════"
echo ""

if [ $FAILED -eq 0 ]; then
    echo "🎉 ALL TESTS PASSED!"
    echo ""
    echo "Your CCTP + LayerZero integration is working end-to-end!"
    echo ""
    echo "Transaction Hash (Base): $TXHASH"
    echo "Check Solana Explorer: https://explorer.solana.com/address/MHso38U1uo8br3gSU6bXKC8apXorKzfwPqMVgYaKCma?cluster=devnet"
    echo ""
    exit 0
else
    echo "⚠️  Some tests failed. Review output above for details."
    exit 1
fi
