import { NextRequest, NextResponse } from 'next/server';
import { hcmState, simulateDelay, getBalance } from '../../../_state';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ employeeId: string; locationId: string }> }
) {
  await simulateDelay();

  if (hcmState.config.silentFailMode) {
    return NextResponse.json({}, { status: 200 }); // Garbled — empty body
  }

  const { employeeId, locationId } = await params;
  const available = getBalance(employeeId, locationId);

  if (available === null) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  }

  return NextResponse.json({
    employeeId,
    locationId,
    available,
    updatedAt: new Date().toISOString(),
  });
}
