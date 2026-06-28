'use client';

import React, { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'sonner';
import { makeQueryClient } from '@/lib/query-client';
import { AuthProvider } from './auth-provider';

export function Providers({ children }: { children: React.ReactNode }): React.ReactElement {
  // Ensure queryClient is initialized once in the client component lifecycle
  const [queryClient] = useState(() => makeQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
        <Toaster
          position="top-right"
          richColors
          toastOptions={{
            duration: 4000,
            style: {
              background: '#ffffff',
              color: '#000000',
              border: '1px solid #e4e4e7',
            },
          }}
        />
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
