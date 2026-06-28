import { api } from '@/services/axios';
import type { ApiSuccess, HealthStatus } from '@/types/api';

/**
 * Fetch backend health/readiness. Used by the landing page to surface live
 * frontend↔backend connectivity.
 */
export async function getHealth(): Promise<HealthStatus> {
  const { data } = await api.get<ApiSuccess<HealthStatus>>('/health');
  return data.data;
}
