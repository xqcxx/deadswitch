#!/bin/bash

# Frontend Deployment Script
# Usage: ./scripts/deploy-frontend.sh [preview|production]

set -e

DEPLOYMENT_TYPE=${1:-preview}

if [[ "$DEPLOYMENT_TYPE" != "preview" && "$DEPLOYMENT_TYPE" != "production" ]]; then
    echo "Error: Deployment type must be 'preview' or 'production'"
    echo "Usage: ./scripts/deploy-frontend.sh [preview|production]"
    exit 1
fi

echo "🚀 Deploying frontend to $DEPLOYMENT_TYPE..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [[ ! -d "frontend" ]]; then
    echo -e "${RED}❌ Error: frontend directory not found${NC}"
    echo "Please run this script from the project root"
    exit 1
fi

# Check Node.js version
echo "📋 Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [[ "$NODE_VERSION" -lt 18 ]]; then
    echo -e "${RED}❌ Node.js 18+ required. Found: $(node -v)${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v)${NC}"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠️  Vercel CLI not found. Installing...${NC}"
    npm install -g vercel
fi
echo -e "${GREEN}✓ Vercel CLI installed${NC}"

# Navigate to frontend directory
cd frontend

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
if npm install; then
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi

# Check if .env.local exists
if [[ ! -f ".env.local" ]]; then
    echo -e "${YELLOW}⚠️  .env.local not found${NC}"
    if [[ -f ".env.example" ]]; then
        echo "Creating .env.local from .env.example..."
        cp .env.example .env.local
        echo -e "${YELLOW}⚠️  Please update .env.local with your contract addresses${NC}"
    fi
fi

# Run tests
echo ""
echo "🧪 Running tests..."
if npm test 2>/dev/null; then
    echo -e "${GREEN}✓ Tests passed${NC}"
else
    echo -e "${YELLOW}⚠️  No tests found or tests failed${NC}"
fi

# Build the application
echo ""
echo "🔨 Building application..."
if npm run build; then
    echo -e "${GREEN}✓ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

# Deploy
echo ""
echo "📤 Deploying to Vercel..."
if [[ "$DEPLOYMENT_TYPE" == "production" ]]; then
    echo -e "${BLUE}Deploying to production...${NC}"
    vercel --prod
else
    echo -e "${BLUE}Deploying preview...${NC}"
    vercel
fi

echo ""
echo -e "${GREEN}✅ Frontend deployment complete!${NC}"
