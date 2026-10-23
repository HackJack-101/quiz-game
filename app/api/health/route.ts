import { NextResponse } from 'next/server';

export async function GET() {
  // APP_VERSION and APP_COMMIT are set by CI when the Docker image is built.
  return NextResponse.json(
    { status: 'ok', version: process.env.APP_VERSION ?? 'dev', commit: process.env.APP_COMMIT || null },
    { status: 200 },
  );
}
