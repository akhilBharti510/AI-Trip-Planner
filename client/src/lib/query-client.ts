import { QueryClient } from '@tanstack/react-query';

/**
 * Factory for the TanStack Query client. A factory (rather than a module-level
 * singleton) keeps each browser session — and each test — isolated, and avoids
 * sharing cache across requests during SSR.
 */
export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 min — avoids refetch storms on navigation
        gcTime: 5 * 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}
