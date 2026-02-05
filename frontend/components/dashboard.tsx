'use client';

import { useState } from 'react';
import { useWallet } from '../hooks/use-wallet';
import { useSwitchStatus, useVaultBalance } from '../hooks/use-deadswitch';
import { openContractCall } from '@stacks/connect';
import { uintCV } from '@stacks/transactions';
import { DEPLOYER, CONTRACTS, network } from '../lib/stacks';
import { parseContractError } from '../lib/errors';
import { showToast } from './toast';
import { validateInterval, validateGracePeriod } from '../lib/validation';

export function Dashboard() {
  const { address } = useWallet();
  const { status, refetch: refetchStatus } = useSwitchStatus(address);
  const { balance, refetch: refetchBalance } = useVaultBalance(address);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = () => {
    const interval = 144;
    const gracePeriod = 144;
    
    // Validate inputs
    const intervalValidation = validateInterval(interval);
    if (!intervalValidation.valid) {
      showToast(intervalValidation.error!, 'error');
      return;
    }
    
    const graceValidation = validateGracePeriod(gracePeriod);
    if (!graceValidation.valid) {
      showToast(graceValidation.error!, 'error');
      return;
    }
    
    setIsLoading(true);
    openContractCall({
      contractAddress: DEPLOYER,
      contractName: CONTRACTS.HEARTBEAT,
      functionName: 'register-switch',
      functionArgs: [uintCV(interval), uintCV(gracePeriod)],
      network,
      onFinish: (data) => {
        setIsLoading(false);
        if (data.txId) {
          showToast('Switch registered successfully!', 'success');
          setTimeout(() => {
            refetchStatus();
            refetchBalance();
          }, 2000);
        }
      },
      onCancel: () => {
        setIsLoading(false);
        showToast('Transaction cancelled', 'info');
      },
    }).catch(err => {
      setIsLoading(false);
      const { message } = parseContractError(err);
      showToast(`Failed to register: ${message}`, 'error');
      console.error('Register error:', err);
    });
  };

  const handleHeartbeat = () => {
    setIsLoading(true);
    openContractCall({
      contractAddress: DEPLOYER,
      contractName: CONTRACTS.HEARTBEAT,
      functionName: 'heartbeat',
      functionArgs: [],
      network,
      onFinish: (data) => {
        setIsLoading(false);
        if (data.txId) {
          showToast('Heartbeat sent successfully!', 'success');
          setTimeout(() => {
            refetchStatus();
            refetchBalance();
          }, 2000);
        }
      },
      onCancel: () => {
        setIsLoading(false);
        showToast('Transaction cancelled', 'info');
      },
    }).catch(err => {
      setIsLoading(false);
      const { message } = parseContractError(err);
      showToast(`Failed to send heartbeat: ${message}`, 'error');
      console.error('Heartbeat error:', err);
    });
  };

  if (status === null) {
    return (
      <div className="flex flex-col items-center gap-4 p-8">
        <h2 className="text-2xl font-bold">No Switch Found</h2>
        <p>You haven't set up a DeadSwitch yet.</p>
        <button 
          onClick={handleRegister}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Creating...' : 'Create Switch (1 Day Interval)'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 p-8 max-w-2xl mx-auto w-full">
      <h2 className="text-3xl font-bold tracking-tight">Your Switch Status</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        <div className="p-6 border rounded-lg shadow-sm bg-white dark:bg-zinc-900">
          <h3 className="text-sm text-gray-500 mb-1">Status</h3>
          <p className={`text-xl font-bold ${status.active ? 'text-green-500' : 'text-red-500'}`}>
            {status.active ? 'Active' : 'Inactive'}
          </p>
        </div>
        <div className="p-6 border rounded-lg shadow-sm bg-white dark:bg-zinc-900">
          <h3 className="text-sm text-gray-500 mb-1">Vault Balance</h3>
          <p className="text-xl font-mono">{balance?.toString() || '0'} uSTX</p>
        </div>
        <div className="p-6 border rounded-lg shadow-sm bg-white dark:bg-zinc-900 md:col-span-2">
          <h3 className="text-sm text-gray-500 mb-1">Last Check-in Block</h3>
          <p className="text-xl font-mono">{status['last-check-in']?.toString() || '0'}</p>
        </div>
      </div>

      <div className="flex gap-4 w-full justify-center">
        <button 
          onClick={handleHeartbeat}
          disabled={isLoading}
          className="w-full md:w-auto px-8 py-4 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="animate-pulse">●</span> {isLoading ? 'Sending...' : 'PULSE (Heartbeat)'}
        </button>
      </div>
    </div>
  );
}
