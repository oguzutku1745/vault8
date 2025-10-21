#!/bin/bash
set -e  # Exit on any error

echo "🚀 Starting full deployment process..."
echo "========================================"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Generate fresh keypair
echo -e "\n${BLUE}Step 1: Generating fresh keypair...${NC}"
solana-keygen new -o target/deploy/my_oapp-keypair.json --force --no-bip39-passphrase

# Step 2: Extract program ID from keypair
echo -e "\n${BLUE}Step 2: Extracting program ID...${NC}"
PROGRAM_ID=$(solana-keygen pubkey target/deploy/my_oapp-keypair.json)
echo -e "${GREEN}Program ID: $PROGRAM_ID${NC}"

# Step 3: Sync with Anchor
echo -e "\n${BLUE}Step 3: Syncing Anchor keys...${NC}"
anchor keys sync

# Step 4: Build program
echo -e "\n${BLUE}Step 4: Building program with ID $PROGRAM_ID...${NC}"
MYOAPP_ID=$PROGRAM_ID anchor build

# Step 5: Deploy program
echo -e "\n${BLUE}Step 5: Deploying program to devnet...${NC}"
solana program deploy --program-id target/deploy/my_oapp-keypair.json target/deploy/my_oapp.so -u devnet

sleep 10

# Step 6: Regenerate SDK
echo -e "\n${BLUE}Step 6: Regenerating SDK...${NC}"
cd lib && pnpm gen:api && cd ..

sleep 2

# Step 7: Initialize Store
echo -e "\n${BLUE}Step 7: Initializing Store PDA...${NC}"
npx hardhat lz:oapp:solana:create --eid 40168 --program-id $PROGRAM_ID || echo -e "${YELLOW}Store may already exist, continuing...${NC}"

sleep 10

# Step 8: Set Jupiter Lend config
echo -e "\n${BLUE}Step 8: Setting Jupiter Lend configuration...${NC}"
npx hardhat lz:oapp:solana:set-jl-config --eid 40168 --jl-config ../vault8-frontend/scripts/jl-context-devnet-usdc.json

sleep 10

# Step 9: Create ALT for Jupiter Lend
echo -e "\n${BLUE}Step 9: Creating Address Lookup Table...${NC}"
ALT_OUTPUT=$(node ./deployment-helpers/create-alt-for-jl.js 2>&1)
sleep 5
echo "$ALT_OUTPUT"
ALT_ADDRESS=$(echo "$ALT_OUTPUT" | grep -oP "(?<=ALT Address: )[A-Za-z0-9]{43,44}" | tail -1)

if [ -z "$ALT_ADDRESS" ]; then
    echo -e "${YELLOW}Could not extract ALT address automatically. Please check create-alt-for-jl.js output above.${NC}"
    echo -e "${YELLOW}Extracting ALT from output...${NC}"
    # Alternative extraction method
    ALT_ADDRESS=$(echo "$ALT_OUTPUT" | grep "ALT Address:" | awk '{print $NF}')
fi

echo -e "${GREEN}ALT Address extracted: $ALT_ADDRESS${NC}"

# Step 10: Set ALT on Store
echo -e "\n${BLUE}Step 10: Setting ALT on Store...${NC}"
node ./deployment-helpers/set-alt.js $ALT_ADDRESS

sleep 5

# Step 11: Initialize Store ATAs
echo -e "\n${BLUE}Step 11: Initializing Store ATAs...${NC}"
node ./deployment-helpers/init-store-atas.js

sleep 10

# Step 12: Fund Store USDC
echo -e "\n${BLUE}Step 12: Funding Store with 2 USDC...${NC}"
# Temporarily update the amount to 2 USDC for deployment
sed -i.bak 's/const AMOUNT_TO_FUND = [0-9_]*;/const AMOUNT_TO_FUND = 2_000_000;/' fund-store-usdc.js
node ./deployment-helpers/fund-store-usdc.js
# Restore original amount
mv fund-store-usdc.js.bak fund-store-usdc.js 2>/dev/null || true

echo -e "\n${GREEN}✅ Automated deployment complete!${NC}"
echo -e "${GREEN}=======================================${NC}"
echo -e "\n${YELLOW}📋 Next Manual Steps:${NC}"
echo -e "1️⃣  Run init-config (will prompt for approvals):"
echo -e "   ${BLUE}npx hardhat lz:oapp:solana:init-config --oapp-config layerzero.config.ts${NC}"
echo -e "\n2️⃣  Then wire the OApp (will prompt for approvals):"
echo -e "   ${BLUE}npx hardhat lz:oapp:wire --oapp-config layerzero.config.ts${NC}"
echo -e "\n3️⃣  Test with a deposit:"
echo -e "   ${BLUE}npx hardhat lz:oapp:send-amount --network BASE-sepolia --dst-eid 40168 --amount-base-units 500000${NC}"
echo -e "\n${GREEN}Program ID: $PROGRAM_ID${NC}"
echo -e "${GREEN}ALT Address: $ALT_ADDRESS${NC}"
echo ""

