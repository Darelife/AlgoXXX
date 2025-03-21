import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Make the request to the contest delta API
    const response = await fetch(
      'https://algoxxx.onrender.com/currentinfo/contestdeltafetch',
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    await response.json();
    
    // Return success
    return NextResponse.json({ 
      success: true, 
      message: 'Contest delta updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating contest delta:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to update contest delta',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}