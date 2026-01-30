# DeadSwitch

**Your secrets outlive your silence.**

DeadSwitch is a Bitcoin heartbeat-based dead man's switch protocol built on Stacks. You must "ping" the blockchain every X Bitcoin blocks to prove you're alive/active. If you miss your check-in window, a pre-programmed trigger distributes your assets and reveals your secret pointer.

## Features

- **Heartbeat System** - Prove you're alive with blockchain check-ins
- **Asset Vault** - Lock STX and encrypted message pointers (URI/Hash)
- **Beneficiary Management** - Define distribution percentages for your vault
- **Guardian Network** - Trusted parties who can extend your timer
- **Trigger Execution** - Manual or keeper-based trigger that distributes assets on timeout

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
| `vault` | Locked STX assets and secret pointers |
| `beneficiary-mgr` | Asset distribution rules (percentages) |
| `guardian-network` | Trusted timer extenders |
| `trigger-actions` | Execution logic (distributes vault to beneficiaries) |
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

## Operational Note

The switch does not trigger "automatically" at the exact block height. A transaction must be sent to `trigger-actions.execute-trigger` by a beneficiary, a keeper bot, or any interested party after the deadline has passed.

## Built with Clarity 4

This project uses Clarity 4 features including:
- `stacks-block-time` for time-based deadlines
- `burn-block-height` for Bitcoin block tracking
- Native SIP-009 NFT standard

## License

MIT
