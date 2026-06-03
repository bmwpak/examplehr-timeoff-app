import { NextRequest, NextResponse } from 'next/server';
import { hcmState, simulateDelay, addBalance } from '../../../_state';

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

  // Refund balance on denial if it was deducted at submission
  if (!hcmState.config.conflictMode) {
    addBalance(request.employeeId, request.locationId, request.daysRequested);
  }

  request.status = 'denied';
  request.resolvedAt = new Date().toISOString();

  return NextResponse.json({ requestId: id, status: 'denied' });
}
