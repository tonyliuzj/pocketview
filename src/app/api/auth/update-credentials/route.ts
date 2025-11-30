import { NextRequest, NextResponse } from 'next/server';
import { getSession, createSession } from '@/lib/auth';
import { updateUserCredentials } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { newUsername, newPassword } = body;

    if (!newUsername) {
      return NextResponse.json(
        { error: 'New username is required' },
        { status: 400 }
      );
    }

    const success = updateUserCredentials(
      session.username,
      newUsername,
      newPassword || undefined
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update credentials' },
        { status: 500 }
      );
    }

    // Create new session with updated username
    await createSession(newUsername);

    return NextResponse.json({
      success: true,
      username: newUsername,
    });
  } catch (error) {
    console.error('Update credentials error:', error);
    return NextResponse.json(
      { error: 'Failed to update credentials' },
      { status: 500 }
    );
  }
}
