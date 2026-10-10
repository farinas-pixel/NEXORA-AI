// src/services/network/networkService.ts
/**
 * NEXORA AI — Production Network & Offline Detection Service
 * Real-time hardware network monitor using expo-network.
 * Detects offline state, prevents failing online requests, and auto-reconnects when network returns.
 */
import * as Network from 'expo-network';

export interface NetworkStateInfo {
  isOnline: boolean;
  isConnected: boolean;
}

export const NetworkService = {
  /**
   * Check current network connectivity status
   */
  async checkConnection(): Promise<NetworkStateInfo> {
    try {
      const state = await Network.getNetworkStateAsync();
      const isConnected = Boolean(state.isConnected);
      const isOnline = isConnected && (state.isInternetReachable ?? true);
      return { isOnline, isConnected };
    } catch {
      const onLine = typeof navigator !== 'undefined' ? (navigator.onLine ?? true) : true;
      return { isOnline: onLine, isConnected: onLine };
    }
  },

  /**
   * Subscribe to real-time network state changes
   */
  subscribe(callback: (state: NetworkStateInfo) => void): () => void {
    try {
      const subscription = Network.addNetworkStateListener((event: Network.NetworkStateEvent) => {
        const isConnected = Boolean(event.isConnected);
        const isOnline = isConnected && (event.isInternetReachable ?? true);
        callback({ isOnline, isConnected });
      });

      return () => {
        subscription.remove();
      };
    } catch {
      return () => {};
    }
  },
};
