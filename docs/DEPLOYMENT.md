# Deployment Guide

This guide covers deploying DeadSwitch contracts to testnet/mainnet and deploying the frontend application.

## Prerequisites

Before deploying, ensure you have:

- [Clarinet](https://github.com/hirosystems/clarinet) installed (v2.4.0+)
- A Stacks wallet with sufficient funds for deployment
- Node.js 18+ for frontend deployment
- Access to deployment environment variables

## Table of Contents

- [Contract Deployment](#contract-deployment)
- [Frontend Deployment](#frontend-deployment)
- [Environment Setup](#environment-setup)
- [Automated Deployment](#automated-deployment)

## Contract Deployment

### Testnet Deployment

1. **Prepare your wallet**
   ```bash
   # Ensure your mnemonic is ready (DO NOT commit this!)
   export STACKS_MNEMONIC="your twelve word mnemonic phrase here"
   ```

2. **Run tests before deploying**
   ```bash
   clarinet test
   clarinet check
   ```

3. **Deploy to testnet**
   ```bash
   clarinet deploy --testnet
   ```

4. **Verify deployment**
   - Check the Stacks Explorer for your contract addresses
   - Note the deployed contract addresses for frontend configuration

### Mainnet Deployment

⚠️ **WARNING**: Mainnet deployment is permanent and costs real STX. Test thoroughly on testnet first.

1. **Verify contract readiness**
   - All tests passing
   - Security audit completed (recommended)
   - Community review completed

2. **Deploy to mainnet**
   ```bash
   clarinet deploy --mainnet
   ```

3. **Monitor deployment**
   - Watch for deployment transaction confirmation
   - Save all contract addresses securely
   - Update frontend environment variables

## Frontend Deployment

### Build for Production

```bash
cd frontend
npm install
npm run build
```

### Deploy to Vercel

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

### Environment Variables

Create a `.env.local` file in the `frontend` directory:

```env
NEXT_PUBLIC_STACKS_NETWORK=testnet
NEXT_PUBLIC_CONTRACT_ADDRESS=ST...
HEARTBEAT_CORE_CONTRACT=heartbeat-core
VAULT_CONTRACT=vault
BENEFICIARY_MGR_CONTRACT=beneficiary-mgr
GUARDIAN_NETWORK_CONTRACT=guardian-network
TRIGGER_ACTIONS_CONTRACT=trigger-actions
SWITCH_NFT_CONTRACT=switch-nft
```

## Environment Setup

### Local Development

Use Docker for consistent local development:

```bash
docker-compose up -d
```

This starts:
- Local Stacks devnet
- Mocknet for testing
- PostgreSQL for indexer (optional)

### Staging Environment

Set up a staging environment mirroring production:

1. Deploy contracts to testnet
2. Deploy frontend to staging URL
3. Configure separate environment variables
4. Run integration tests

## Automated Deployment

### GitHub Actions

Deployment is automated via GitHub Actions. See `.github/workflows/` for details.

**Manual Trigger:**
Go to Actions → Deploy to Testnet → Run workflow

### Scripts

Use the provided deployment scripts:

```bash
# Deploy contracts
./scripts/deploy-contracts.sh testnet

# Deploy frontend
./scripts/deploy-frontend.sh

# Full deployment
make deploy-all
```

## Troubleshooting

### Common Issues

1. **Insufficient funds**
   - Ensure wallet has enough STX for deployment fees
   - Testnet: Use faucet at https://explorer.hiro.so/sandbox/faucet

2. **Contract check failures**
   - Run `clarinet check` to identify issues
   - Fix syntax errors before deploying

3. **Frontend build errors**
   - Check Node.js version (requires 18+)
   - Clear `node_modules` and reinstall

## Post-Deployment

### Verification Checklist

- [ ] Contracts deployed successfully
- [ ] Contract addresses documented
- [ ] Frontend environment variables updated
- [ ] Frontend deployed and accessible
- [ ] Integration tests pass
- [ ] Monitoring configured

### Monitoring

Set up monitoring for:
- Contract activity
- Error rates
- User interactions
- Gas usage

## Support

For deployment issues:
- Check the [Troubleshooting](#troubleshooting) section
- Open an issue on GitHub
- Join our Discord community
