.PHONY: help install test build deploy-contracts deploy-frontend deploy-all dev clean

# Default target
help:
	@echo "DeadSwitch - Available Commands"
	@echo ""
	@echo "Setup:"
	@echo "  make install          - Install all dependencies"
	@echo ""
	@echo "Development:"
	@echo "  make dev              - Start development server"
	@echo "  make test             - Run all tests"
	@echo "  make test-contracts   - Run contract tests only"
	@echo "  make test-frontend    - Run frontend tests only"
	@echo "  make lint             - Run linting"
	@echo ""
	@echo "Deployment:"
	@echo "  make deploy-contracts-testnet   - Deploy contracts to testnet"
	@echo "  make deploy-contracts-mainnet   - Deploy contracts to mainnet"
	@echo "  make deploy-frontend-preview    - Deploy frontend preview"
	@echo "  make deploy-frontend-prod       - Deploy frontend to production"
	@echo "  make deploy-all                 - Deploy everything to testnet"
	@echo ""
	@echo "Infrastructure:"
	@echo "  make devnet-up        - Start local devnet"
	@echo "  make devnet-down      - Stop local devnet"
	@echo "  make clean            - Clean build artifacts"

# Setup
install:
	@echo "📦 Installing root dependencies..."
	npm install
	@echo "📦 Installing frontend dependencies..."
	cd frontend && npm install

# Development
dev:
	@echo "🚀 Starting development server..."
	cd frontend && npm run dev

# Testing
test: test-contracts test-frontend
	@echo "✅ All tests completed"

test-contracts:
	@echo "🧪 Running contract tests..."
	clarinet test

test-frontend:
	@echo "🧪 Running frontend tests..."
	cd frontend && npm test

# Linting
lint:
	@echo "🔍 Running linter..."
	cd frontend && npm run lint

# Build
build:
	@echo "🔨 Building frontend..."
	cd frontend && npm run build

# Contract Deployment
deploy-contracts-testnet:
	@echo "🚀 Deploying contracts to testnet..."
	./scripts/deploy-contracts.sh testnet

deploy-contracts-mainnet:
	@echo "🚀 Deploying contracts to mainnet..."
	./scripts/deploy-contracts.sh mainnet

# Frontend Deployment
deploy-frontend-preview:
	@echo "🚀 Deploying frontend preview..."
	./scripts/deploy-frontend.sh preview

deploy-frontend-prod:
	@echo "🚀 Deploying frontend to production..."
	./scripts/deploy-frontend.sh production

# Full Deployment
deploy-all: deploy-contracts-testnet deploy-frontend-preview
	@echo "✅ Full deployment completed"

# Devnet
devnet-up:
	@echo "🌐 Starting local devnet..."
	docker-compose up -d

devnet-down:
	@echo "🛑 Stopping local devnet..."
	docker-compose down

devnet-logs:
	@echo "📋 Showing devnet logs..."
	docker-compose logs -f

# Cleanup
clean:
	@echo "🧹 Cleaning build artifacts..."
	rm -rf frontend/.next
	rm -rf frontend/node_modules
	rm -rf node_modules
	find . -name "*.log" -delete
	find . -type d -name "coverage" -exec rm -rf {} + 2>/dev/null || true

# Pre-deployment checks
check:
	@echo "🔍 Running pre-deployment checks..."
	clarinet check
	cd frontend && npm run build
	@echo "✅ All checks passed"
