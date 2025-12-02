import { NextResponse } from 'next/server';
import { getConfig, getBeszelAuthHeaders } from '@/lib/db';

export async function GET() {
  try {
    const config = getConfig();

    if (!config) {
      return NextResponse.json(
        { error: 'Beszel not configured. Please configure in admin settings.' },
        { status: 400 }
      );
    }

    const headers = await getBeszelAuthHeaders(config);

    const response = await fetch(`${config.beszel_url}/api/systems`, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`Beszel API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching systems from Beszel:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch systems data' },
      { status: 500 }
    );
  }
}
