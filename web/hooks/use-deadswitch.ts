import { useCallback, useEffect, useState } from 'react';
import { callReadOnlyFunction, cvToValue, standardPrincipalCV } from '@stacks/transactions';
import { CONTRACTS, DEPLOYER, network } from '../lib/stacks';

export function useSwitchStatus(address: string | null) {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchStatus = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    try {
      const result = await callReadOnlyFunction({
        contractAddress: DEPLOYER,
        contractName: CONTRACTS.HEARTBEAT,
        functionName: 'get-status',
        functionArgs: [standardPrincipalCV(address)],
        network,
        senderAddress: address,
      });
      setStatus(cvToValue(result));
    } catch (e) {
      console.error(e);
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return { status, loading, refetch: fetchStatus };
}

export function useVaultBalance(address: string | null) {
  const [balance, setBalance] = useState<bigint>(0n);

  const fetchBalance = useCallback(async () => {
    if (!address) return;
    try {
      const result = await callReadOnlyFunction({
        contractAddress: DEPLOYER,
        contractName: CONTRACTS.VAULT,
        functionName: 'get-balance',
        functionArgs: [standardPrincipalCV(address)],
        network,
        senderAddress: address,
      });
      setBalance(cvToValue(result).value);
    } catch (e) {
      console.error(e);
    }
  }, [address]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return { balance, refetch: fetchBalance };
}
