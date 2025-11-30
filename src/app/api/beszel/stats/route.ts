import { NextRequest, NextResponse } from 'next/server';
import { getConfig } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const config = getConfig();

    if (!config) {
      return NextResponse.json(
        { error: 'Beszel not configured. Please configure in admin settings.' },
        { status: 400 }
      );
    }

    const { beszel_url, beszel_api_key } = config;
    const searchParams = request.nextUrl.searchParams;
    const systemId = searchParams.get('systemId');

    if (!systemId) {
      return NextResponse.json(
        { error: 'System ID is required' },
        { status: 400 }
      );
    }

    const response = await fetch(`${beszel_url}/api/systems/${systemId}/stats`, {
      headers: {
        'Authorization': `Bearer ${beszel_api_key}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Beszel API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching stats from Beszel:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch stats data' },
      { status: 500 }
    );
  }
}
