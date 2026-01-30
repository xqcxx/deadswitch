'use client';

import { useWallet } from './hooks/use-wallet';
import { Dashboard } from './components/dashboard';

export default function Home() {
  const { isConnected, connectWallet } = useWallet();

  if (isConnected) {
    return <Dashboard />;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100">
       <div className="max-w-xl text-center space-y-8">
         <h1 className="text-6xl font-extrabold tracking-tight">DeadSwitch</h1>
         <p className="text-2xl font-light text-zinc-500 dark:text-zinc-400">
           Your secrets outlive your silence.
         </p>
         <button 
           onClick={() => connectWallet()}
           className="px-8 py-4 bg-black dark:bg-white text-white dark:text-black rounded-full font-medium hover:opacity-90 transition text-lg"
         >
           Connect Wallet
         </button>
       </div>
    </main>
  );
}
