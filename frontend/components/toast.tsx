'use client';

import { useState, useEffect } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

let toastIdCounter = 0;
let toastListeners: ((toast: Toast) => void)[] = [];

export function showToast(message: string, type: ToastType = 'info') {
  const toast: Toast = {
    id: toastIdCounter++,
    message,
    type
  };
  toastListeners.forEach(listener => listener(toast));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listener = (toast: Toast) => {
      setToasts(prev => [...prev, toast]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toast.id));
      }, 5000);
    };
    toastListeners.push(listener);
    return () => {
      toastListeners = toastListeners.filter(l => l !== listener);
    };
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`px-4 py-3 rounded-lg shadow-lg text-white min-w-[300px] animate-slide-in ${
            toast.type === 'success' ? 'bg-green-600' :
            toast.type === 'error' ? 'bg-red-600' :
            'bg-blue-600'
          }`}
        >
          <div className="flex items-start gap-2">
            <span className="text-lg">
              {toast.type === 'success' ? '✓' : 
               toast.type === 'error' ? '✕' : 'ℹ'}
            </span>
            <p className="flex-1 text-sm">{toast.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
