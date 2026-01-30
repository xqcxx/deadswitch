import { StacksTestnet, StacksMainnet } from '@stacks/network';

export const network = process.env.NEXT_PUBLIC_STACKS_NETWORK === 'mainnet'
  ? new StacksMainnet()
  : new StacksTestnet();

export const explorerUrl = (txId: string) =>
  `https://explorer.hiro.so/txid/${txId}?chain=${process.env.NEXT_PUBLIC_STACKS_NETWORK || 'testnet'}`;

export const DEPLOYER = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';

export const CONTRACTS = {
  HEARTBEAT: 'heartbeat-core',
  VAULT: 'vault',
  BENEFICIARY: 'beneficiary-mgr',
  GUARDIAN: 'guardian-network',
  TRIGGER: 'trigger-actions',
  NFT: 'switch-nft',
} as const;

export const getContractId = (name: keyof typeof CONTRACTS) => `${DEPLOYER}.${CONTRACTS[name]}`;
