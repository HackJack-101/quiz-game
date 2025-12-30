import { NextRequest, NextResponse } from 'next/server';

import { getGameStats } from '@/lib/db-utils';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const gameId = parseInt(id, 10);

    if (isNaN(gameId)) {
      return NextResponse.json({ error: 'Invalid game ID' }, { status: 400 });
    }

    const stats = getGameStats(gameId);

    if (!stats) {
      return NextResponse.json({ error: 'Game stats not found' }, { status: 404 });
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error in GET /api/games/[id]/stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
