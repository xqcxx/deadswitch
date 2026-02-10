#!/bin/bash

# Contract Deployment Script
# Usage: ./scripts/deploy-contracts.sh [testnet|mainnet]

set -e

NETWORK=${1:-testnet}

if [[ "$NETWORK" != "testnet" && "$NETWORK" != "mainnet" ]]; then
    echo "Error: Network must be 'testnet' or 'mainnet'"
    echo "Usage: ./scripts/deploy-contracts.sh [testnet|mainnet]"
    exit 1
fi

echo "🚀 Deploying contracts to $NETWORK..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Clarinet is installed
if ! command -v clarinet &> /dev/null; then
    echo -e "${RED}❌ Clarinet is not installed${NC}"
    echo "Please install Clarinet: https://github.com/hirosystems/clarinet"
    exit 1
fi

# Check if mnemonic is set
if [[ -z "$STACKS_MNEMONIC" ]]; then
    echo -e "${YELLOW}⚠️  STACKS_MNEMONIC environment variable not set${NC}"
    echo "Please set your mnemonic:"
    echo "  export STACKS_MNEMONIC=\"your twelve word mnemonic phrase\""
    exit 1
fi

echo -e "${GREEN}✓ Clarinet found${NC}"
echo -e "${GREEN}✓ Mnemonic configured${NC}"

# Run tests before deployment
echo ""
echo "🧪 Running tests before deployment..."
if clarinet test; then
    echo -e "${GREEN}✓ All tests passed${NC}"
else
    echo -e "${RED}❌ Tests failed. Aborting deployment.${NC}"
    exit 1
fi

# Check contracts
echo ""
echo "🔍 Checking contracts..."
if clarinet check; then
    echo -e "${GREEN}✓ Contract check passed${NC}"
else
    echo -e "${RED}❌ Contract check failed. Aborting deployment.${NC}"
    exit 1
fi

# Confirm mainnet deployment
if [[ "$NETWORK" == "mainnet" ]]; then
    echo ""
    echo -e "${RED}⚠️  WARNING: You are about to deploy to MAINNET${NC}"
    echo -e "${RED}This will cost real STX and is permanent.${NC}"
    read -p "Are you sure you want to continue? (yes/no): " confirm
    if [[ "$confirm" != "yes" ]]; then
        echo "Deployment cancelled."
        exit 0
    fi
fi

# Deploy
echo ""
echo "📤 Deploying to $NETWORK..."
if clarinet deploy --$NETWORK; then
    echo ""
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo ""
    echo "📋 Next steps:"
    echo "  1. Note the contract addresses from the output above"
    echo "  2. Update frontend/.env.local with new addresses"
    echo "  3. Test the deployed contracts"
    echo "  4. Update documentation with deployment details"
else
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi
