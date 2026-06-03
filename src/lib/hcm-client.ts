import { MUTATION_TIMEOUT } from './constants';
import { BalanceSchema, BalancesSchema, SubmitResponseSchema, safeParseHCM } from './schemas';
import type { Balance } from '@/types';

export class HCMError extends Error {
  constructor(
    public code: string,
    public available?: number,
    message?: string
  ) {
    super(message ?? code);
  }
}

async function fetchWithTimeout(input: RequestInfo, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), MUTATION_TIMEOUT);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchBalance(employeeId: string, locationId: string): Promise<Balance> {
  const res = await fetchWithTimeout(`/api/hcm/balance/${employeeId}/${locationId}`);
  const json = await res.json().catch(() => null);
  const parsed = safeParseHCM(BalanceSchema, json);
  if (!parsed) throw new HCMError('SILENT_FAILURE');
  return parsed;
}

export async function fetchAllBalances(employeeId: string): Promise<Balance[]> {
  const res = await fetchWithTimeout(`/api/hcm/balances?employeeId=${employeeId}`);
  const json = await res.json().catch(() => null);
  const parsed = safeParseHCM(BalancesSchema, json);
  if (!parsed) throw new HCMError('SILENT_FAILURE');
  return parsed;
}

export async function submitRequest(body: {
  employeeId: string;
  locationId: string;
  startDate: string;
  endDate: string;
  daysRequested: number;
  reason: string;
}): Promise<{ requestId: string; status: 'pending' }> {
  const res = await fetchWithTimeout('/api/hcm/requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const errorCode = json?.error ?? 'UNKNOWN_ERROR';
    throw new HCMError(errorCode, json?.available);
  }

  const parsed = safeParseHCM(SubmitResponseSchema, json);
  if (!parsed) throw new HCMError('SILENT_FAILURE');

  return parsed;
}

export async function approveRequest(requestId: string): Promise<void> {
  const res = await fetchWithTimeout(`/api/hcm/requests/${requestId}/approve`, { method: 'PUT' });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new HCMError(json?.error ?? 'APPROVAL_FAILED', json?.available);
  }
}

export async function denyRequest(requestId: string): Promise<void> {
  const res = await fetchWithTimeout(`/api/hcm/requests/${requestId}/deny`, { method: 'PUT' });
  if (!res.ok) throw new HCMError('DENY_FAILED');
}
