import { NextRequest, NextResponse } from 'next/server';
import { hcmState, simulateDelay, getBalance, deductBalance } from '../../../_state';

export async function PUT(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await simulateDelay();

  const { id } = await params;
  const request = hcmState.requests.find(r => r.id === id);
  if (!request) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  if (request.status !== 'pending') {
    return NextResponse.json({ error: 'ALREADY_RESOLVED' }, { status: 409 });
  }

  // ALWAYS re-check balance at approval time (manager path is pessimistic).
  // If balance was NOT already deducted during submission (conflict mode was on),
  // verify there is enough and then deduct now. Otherwise balance was already
  // deducted at submission time — just mark as approved.
  if (!request.balanceDeducted) {
    const available = getBalance(request.employeeId, request.locationId);
    if (available === null || available < request.daysRequested) {
      return NextResponse.json(
        { error: 'BALANCE_CHANGED', available: available ?? 0 },
        { status: 409 }
      );
    }
    deductBalance(request.employeeId, request.locationId, request.daysRequested);
  }

  request.status = 'approved';
  request.resolvedAt = new Date().toISOString();
  request.balanceDeducted = true;

  return NextResponse.json({ requestId: id, status: 'approved' });
}
