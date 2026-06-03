import { NextRequest, NextResponse } from 'next/server';
import { hcmState } from '../../_state';
import { z } from 'zod';

const ConfigSchema = z.object({
  silentFailMode: z.boolean().optional(),
  delayMs: z.number().min(0).optional(),
  conflictMode: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = ConfigSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'BAD_REQUEST' }, { status: 400 });

  Object.assign(hcmState.config, parsed.data);

  return NextResponse.json({ config: hcmState.config });
}

export async function GET() {
  return NextResponse.json({ config: hcmState.config });
}
