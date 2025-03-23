import { NextResponse } from 'next/server';

// The TEE backend URL - this would be the Marlin TEE IP address in production
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, language } = body;
    
    if (!code) {
      return NextResponse.json(
        { error: 'No code provided' },
        { status: 400 }
      );
    }

    // Forward the request to the backend running in the TEE
    const response = await fetch(`${BACKEND_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        code, 
        language: language || 'javascript' 
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error || 'Failed to analyze code' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Failed to process request', message: error.message },
      { status: 500 }
    );
  }
} 