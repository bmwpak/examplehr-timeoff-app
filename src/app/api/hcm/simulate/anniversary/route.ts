import { NextRequest, NextResponse } from 'next/server';
import { addBalance } from '../../_state';
import { z } from 'zod';

const AnniversarySchema = z.object({
  employeeId: z.string(),
  locationId: z.string(),
  bonusDays: z.number().int().positive(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = AnniversarySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'BAD_REQUEST' }, { status: 400 });

  addBalance(parsed.data.employeeId, parsed.data.locationId, parsed.data.bonusDays);

  return NextResponse.json({ success: true, message: `+${parsed.data.bonusDays} days granted` });
}
