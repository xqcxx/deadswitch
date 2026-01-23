# DeadSwitch

**Your secrets outlive your silence.**

DeadSwitch is a Bitcoin heartbeat-based dead man's switch protocol built on Stacks. You must "ping" the blockchain every X Bitcoin blocks to prove you're alive/active. If you miss your check-in window, pre-programmed actions trigger: assets transfer, encrypted messages decrypt, or secrets broadcast.

## Features

- **Heartbeat System** - Prove you're alive with blockchain check-ins
- **Asset Vault** - Lock STX and messages securely
- **Beneficiary Management** - Define who receives what when you go silent
- **Guardian Network** - Trusted parties who can extend your timer
- **Automated Actions** - Trigger broadcasts, transfers, or reveals on timeout

## Getting Started

### Prerequisites

- Node.js 18+
- Clarinet (for contract development)
- A Stacks wallet (Leather recommended)

### Installation

```bash
# Install dependencies
cd web && npm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your contract addresses
```

### Development

```bash
# Start the Next.js development server
cd web && npm run dev
```

## Project Structure

```
deadswitch/
├── contracts/           # Clarity smart contracts
│   ├── heartbeat-core.clar
│   ├── vault.clar
│   ├── beneficiary-mgr.clar
│   ├── guardian-network.clar
│   ├── trigger-actions.clar
│   └── switch-nft.clar
├── web/                 # Next.js frontend
│   ├── app/            # App Router pages
│   ├── components/     # React components
│   ├── lib/            # Utilities
│   └── hooks/          # Custom hooks
└── README.md
```

## Contracts

| Contract | Description |
|----------|-------------|
| `heartbeat-core` | Check-in tracking against Bitcoin blocks |
| `vault` | Locked assets and encrypted messages |
| `beneficiary-mgr` | Asset distribution rules on trigger |
| `guardian-network` | Trusted timer extenders |
| `trigger-actions` | Automated execution on timeout |
| `switch-nft` | NFT proof of switch configuration |

## Environment Variables

```env
NEXT_PUBLIC_STACKS_NETWORK=testnet
NEXT_PUBLIC_CONTRACT_ADDRESS=ST...
HEARTBEAT_CORE_CONTRACT=...
VAULT_CONTRACT=...
BENEFICIARY_MGR_CONTRACT=...
GUARDIAN_NETWORK_CONTRACT=...
TRIGGER_ACTIONS_CONTRACT=...
SWITCH_NFT_CONTRACT=...
```

## Deployment

### Frontend

Deploy to Vercel:

```bash
cd web
vercel deploy
```

### Contracts

Deploy to testnet:

```bash
clarinet deploy --testnet
```

## Use Cases

- **Whistleblower Protection** - Automatically release evidence if you go silent
- **Estate Planning** - Transfer assets to family if you pass away
- **Accountability** - Prove you're alive on a schedule
- **Dead Man's Switch** - Traditional dead drop functionality

## Built with Clarity 4

This project uses Clarity 4 features including:
- `stacks-block-time` for time-based deadlines
- `burn-block-height` for Bitcoin block tracking
- Native SIP-009 NFT standard

## License

MIT
