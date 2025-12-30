import { NextRequest, NextResponse } from 'next/server';

import { deleteUser, findOrCreateUser, getUserByEmail } from '@/lib/db-utils';
import { createDemoQuiz } from '@/lib/demo-quiz';

// POST /api/users - Find or create user by email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, locale } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    const existingUser = getUserByEmail(email);
    const user = findOrCreateUser(email);

    if (!existingUser && locale) {
      try {
        await createDemoQuiz(user.id, locale);
      } catch (demoError) {
        console.error('Failed to create demo quiz:', demoError);
        // We don't fail the whole request if demo quiz creation fails
      }
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error in POST /api/users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/users?email=... - Get user by email
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 });
    }

    const user = getUserByEmail(email);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error in GET /api/users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/users?id=... - Delete user by ID
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const deleted = deleteUser(parseInt(id));

    if (!deleted) {
      return NextResponse.json({ error: 'User not found or already deleted' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
