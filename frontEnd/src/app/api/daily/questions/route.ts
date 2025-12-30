import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/client';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    let query = supabase
      .from('daily_generated_questions')
      .select('date, difficulty, contest_id, problem_index')
      .order('date', { ascending: false });

    if (start) {
      query = query.gte('date', start);
    }
    if (end) {
      query = query.lte('date', end);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("Questions fetch error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
