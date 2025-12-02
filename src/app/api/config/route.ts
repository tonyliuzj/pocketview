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
      auth_method: config.auth_method,
      beszel_api_key: config.beszel_api_key,
      beszel_email: config.beszel_email,
      beszel_password: config.beszel_password,
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
    const { beszel_url, auth_method, beszel_api_key, beszel_email, beszel_password } = body;

    if (!beszel_url) {
      return NextResponse.json(
        { error: 'Beszel URL is required' },
        { status: 400 }
      );
    }

    if (!auth_method || (auth_method !== 'api_key' && auth_method !== 'password')) {
      return NextResponse.json(
        { error: 'Valid authentication method is required (api_key or password)' },
        { status: 400 }
      );
    }

    if (auth_method === 'api_key' && !beszel_api_key) {
      return NextResponse.json(
        { error: 'API key is required for API key authentication' },
        { status: 400 }
      );
    }

    if (auth_method === 'password' && (!beszel_email || !beszel_password)) {
      return NextResponse.json(
        { error: 'Email and password are required for password authentication' },
        { status: 400 }
      );
    }

    const config = saveConfig(beszel_url, auth_method, beszel_api_key, beszel_email, beszel_password);

    return NextResponse.json({
      success: true,
      config: {
        beszel_url: config.beszel_url,
        auth_method: config.auth_method,
        beszel_api_key: config.beszel_api_key,
        beszel_email: config.beszel_email,
        beszel_password: config.beszel_password,
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
