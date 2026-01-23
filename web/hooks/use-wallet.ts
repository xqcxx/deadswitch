'use client';

import { useState, useEffect, useCallback } from 'react';
import { connect, disconnect, isConnected, getLocalStorage } from '@stacks/connect';

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkConnection = () => {
      if (isConnected()) {
        const data = getLocalStorage();
        setAddress(data?.addresses?.stx?.[0]?.address || null);
      } else {
        setAddress(null);
      }
      setLoading(false);
    };

    checkConnection();
  }, []);

  const connectWallet = useCallback(async () => {
    try {
      const response = await connect();
      setAddress(response.addresses.stx[0].address);
      return response;
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    disconnect();
    setAddress(null);
  }, []);

  return {
    address,
    isConnected: !!address,
    loading,
    connectWallet,
    disconnectWallet,
  };
}
