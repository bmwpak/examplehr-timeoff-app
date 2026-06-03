import { NextRequest, NextResponse } from 'next/server';
import { hcmState } from '../_state';

export async function GET(req: NextRequest) {
  // Batch is 3x slower than single cell
  await new Promise(r => setTimeout(r, hcmState.config.delayMs * 3));

  const { searchParams } = new URL(req.url);
  const employeeId = searchParams.get('employeeId');

  const results = [];
  const balances = employeeId
    ? { [employeeId]: hcmState.balances[employeeId] ?? {} }
    : hcmState.balances;

  for (const [empId, locations] of Object.entries(balances)) {
    for (const [locationId, available] of Object.entries(locations)) {
      results.push({
        employeeId: empId,
        locationId,
        available,
        updatedAt: new Date().toISOString(),
      });
    }
  }

  return NextResponse.json(results);
}
