import { NextRequest, NextResponse } from 'next/server';
import { getConfig, getBeszelAuthHeaders } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const config = getConfig();

    if (!config) {
      return NextResponse.json(
        { error: 'Beszel not configured. Please configure in admin settings.' },
        { status: 400 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const systemId = searchParams.get('systemId');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    if (!systemId) {
      return NextResponse.json(
        { error: 'System ID is required' },
        { status: 400 }
      );
    }

    const headers = await getBeszelAuthHeaders(config);

    // Build URL to query the system_stats collection
    const url = new URL(`${config.beszel_url}/api/collections/system_stats/records`);
    // Build filter for the specific system and time range
    let filter = `system="${systemId}"`;
    
    if (from) {
      const fromDate = new Date(parseInt(from)).toISOString();
      filter += ` && created>="${fromDate}"`;
    }
    
    if (to) {
      const toDate = new Date(parseInt(to)).toISOString();
      filter += ` && created<="${toDate}"`;
    }
    
    url.searchParams.set('filter', filter);
    url.searchParams.set('sort', 'created');
    url.searchParams.set('perPage', '500'); // Adjust based on your needs

    const response = await fetch(url.toString(), {
      headers,
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
