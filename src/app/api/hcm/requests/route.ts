import { NextRequest, NextResponse } from 'next/server';
import { hcmState, simulateDelay, getBalance, deductBalance, createRequestId } from '../_state';
import { z } from 'zod';

const SubmitBodySchema = z.object({
  employeeId: z.string(),
  locationId: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  daysRequested: z.number().int().positive(),
  reason: z.string(),
});

export async function POST(req: NextRequest) {
  await simulateDelay();

  // Silent fail mode: return 200 with empty body
  if (hcmState.config.silentFailMode) {
    return NextResponse.json({}, { status: 200 });
  }

  const body = await req.json().catch(() => null);
  const parsed = SubmitBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'BAD_REQUEST', details: parsed.error }, { status: 400 });
  }

  const { employeeId, locationId, daysRequested, startDate, endDate, reason } = parsed.data;
  const available = getBalance(employeeId, locationId);

  if (available === null) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  }

  if (available < daysRequested) {
    return NextResponse.json({ error: 'INSUFFICIENT_BALANCE', available }, { status: 409 });
  }

  const requestId = createRequestId();

  // Conflict mode: return success but do NOT deduct balance (simulates HCM inconsistency)
  if (!hcmState.config.conflictMode) {
    deductBalance(employeeId, locationId, daysRequested);
  }

  const request = {
    id: requestId,
    employeeId,
    locationId,
    startDate,
    endDate,
    daysRequested,
    reason,
    status: 'pending' as const,
    submittedAt: new Date().toISOString(),
  };

  hcmState.requests.push(request);

  return NextResponse.json({ requestId, status: 'pending' }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const employeeId = searchParams.get('employeeId');
  const managerId = searchParams.get('managerId');

  let requests = hcmState.requests;

  if (employeeId) {
    requests = requests.filter(r => r.employeeId === employeeId);
  }

  if (managerId) {
    const manager = hcmState.managers.find(m => m.id === managerId);
    if (manager) {
      requests = requests.filter(r => (manager.managesEmployeeIds as readonly string[]).includes(r.employeeId));
    }
  }

  return NextResponse.json(requests);
}
