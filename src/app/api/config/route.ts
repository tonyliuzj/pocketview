import { NextRequest, NextResponse } from 'next/server';
import { getConfig, saveConfig } from '@/lib/db';

export async function GET() {
  try {
    const config = getConfig();

    if (!config) {
      return NextResponse.json({ configured: false }, { status: 200 });
    }

    return NextResponse.json({
      configured: true,
      beszel_url: config.beszel_url,
      beszel_api_key: config.beszel_api_key,
    });
  } catch (error) {
    console.error('Error fetching config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch configuration' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { beszel_url, beszel_api_key } = body;

    if (!beszel_url || !beszel_api_key) {
      return NextResponse.json(
        { error: 'Beszel URL and API key are required' },
        { status: 400 }
      );
    }

    const config = saveConfig(beszel_url, beszel_api_key);

    return NextResponse.json({
      success: true,
      config: {
        beszel_url: config.beszel_url,
        beszel_api_key: config.beszel_api_key,
      },
    });
  } catch (error) {
    console.error('Error saving config:', error);
    return NextResponse.json(
      { error: 'Failed to save configuration' },
      { status: 500 }
    );
  }
}
