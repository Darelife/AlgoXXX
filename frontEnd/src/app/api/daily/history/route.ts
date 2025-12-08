import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/client';

export async function GET(request: Request) {
    try {
        const supabase = createClient();
        const { searchParams } = new URL(request.url);
        const days = parseInt(searchParams.get('days') || '30');

        const now = new Date();
        const pastDate = new Date();
        pastDate.setDate(now.getDate() - days);
        const dateStr = pastDate.toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('daily_leaderboard')
            .select('*')
            .gte('date', dateStr)
            .order('date', { ascending: false })
            .order('points', { ascending: false });

        if (error) throw error;

        return NextResponse.json(data);

    } catch (error: any) {
        console.error("History fetch error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
