import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/client';

// Types
interface CFProblem {
    contestId?: number;
    index?: string;
    name?: string;
    type?: string;
    points?: number;
    rating?: number;
    tags?: string[];
}

interface DBUser {
    id: number;
    cfid: string;
    bitsid: string;
    name: string;
}

export async function POST() {
    try {
        const supabase = createClient();

        // 1. Get Daily Problems (Same logic as frontend)
        // Use IST (UTC+5:30) for consistency
        const now = new Date();
        console.log(now);
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istDate = new Date(now.getTime() + istOffset);
        console.log(istDate);

        const timeunix = Math.floor(istDate.getTime() / 1000);
        const randomSeed = Math.floor(timeunix / 86400);

        const problemsRes = await fetch("https://codeforces.com/api/problemset.problems");
        const problemsData = await problemsRes.json();

        if (problemsData.status !== "OK") throw new Error("Failed to fetch problems");

        const allProblems: CFProblem[] = problemsData.result.problems;
        const rated = allProblems.filter((p) => typeof p.rating === "number");

        const easyProblems = rated.filter((p) => p.rating! >= 800 && p.rating! <= 1200);
        const mediumProblems = rated.filter((p) => p.rating! >= 1300 && p.rating! <= 1600);
        const hardProblems = rated.filter((p) => p.rating! >= 1700 && p.rating! <= 2000);

        const pick = (arr: CFProblem[]) => arr.length ? arr[randomSeed % arr.length] : null;

        const dailyProblems = [
            pick(easyProblems),
            pick(mediumProblems),
            pick(hardProblems),
        ].filter(p => p !== null) as CFProblem[];

        // 2. Get Users
        const usersRes = await fetch("https://algoxxx.onrender.com/database");
        const usersData: DBUser[] = await usersRes.json();
        const userMap = new Map<string, DBUser>();
        usersData.forEach(u => userMap.set(u.cfid.toLowerCase().trim(), u));

        // 3. Process Submissions
        // Calculate start of day in IST

        // Adjust back to UTC timestamp for CF comparison (since CF uses Unix timestamp which is UTC based, but we want 00:00 IST)
        // Wait, new Date(y, m, d) creates a date in LOCAL server time.
        // We constructed istDate manually.
        // Let's be precise:
        // We want the timestamp corresponding to 00:00:00 IST of the current IST day.
        // 00:00 IST = Previous Day 18:30 UTC.

        // Construct string "YYYY-MM-DD" from IST date
        const dateStr = istDate.toISOString().split('T')[0];

        // To get the unix timestamp of 00:00 IST:
        // Create a Date object for that YYYY-MM-DD at 00:00:00 in IST timezone
        // Since we can't easily force timezone in Date constructor, we can calculate it.
        // istDate is the current time shifted to IST.
        // We strip time from it.
        const istDayStart = new Date(istDate);
        istDayStart.setHours(0, 0, 0, 0);
        // Now istDayStart is "00:00" but in the shifted time. 
        // We need to shift it BACK to UTC to get the real timestamp.
        const startOfDay = (istDayStart.getTime() - istOffset) / 1000;

        console.log(`[Sync] IST Date: ${dateStr}`);
        console.log(`[Sync] Start of Day (Unix): ${startOfDay}`);
        console.log(`[Sync] Daily Problems: ${dailyProblems.map(p => p.index).join(', ')}`);

        const userScores = new Map<string, { solveCount: number, points: number, name: string }>();

        for (const problem of dailyProblems) {
            if (!problem.contestId || !problem.index) continue;

            try {
                const apiUrl = `https://codeforces.com/api/contest.status?contestId=${problem.contestId}&from=1&count=10000`;
                console.log(`[Sync] Fetching status from: ${apiUrl}`);
                const statusRes = await fetch(apiUrl);
                const statusData = await statusRes.json();

                if (statusData.status === "OK") {
                    const submissions = statusData.result;
                    console.log(`[Sync] Fetched ${submissions.length} submissions`);
                    const problemSolvers = new Map<string, number>(); // handle -> earliest submission time

                    for (const sub of submissions) {
                        if (sub.creationTimeSeconds < startOfDay) {
                            // console.log(`[Sync] Reached old submissions at ${sub.creationTimeSeconds}`);
                            break;
                        }

                        if (sub.verdict === "OK" && sub.problem.index === problem.index) {
                            for (const author of sub.author.members) {
                                const handle = author.handle.toLowerCase().trim();
                                if (userMap.has(handle)) {
                                    // Store the earliest submission time for this user
                                    const existingTime = problemSolvers.get(handle);
                                    if (!existingTime || sub.creationTimeSeconds < existingTime) {
                                        problemSolvers.set(handle, sub.creationTimeSeconds);
                                    }
                                }
                            }
                        }
                    }

                    const solversCount = problemSolvers.size;
                    console.log(`[Sync] Problem ${problem.index} solved by ${solversCount} registered users`);

                    // Sort solvers by time (ascending)
                    const sortedSolvers = Array.from(problemSolvers.entries())
                        .sort((a, b) => a[1] - b[1]);

                    // Assign points based on rank
                    sortedSolvers.forEach(([handle, _time], index) => {
                        const rank = index + 1; // 1-based rank
                        // Rank 1: 24 points (25 - 1)
                        // Rank 2: 23 points (25 - 2)
                        // ...
                        // Rank 15: 10 points (25 - 15)
                        // Rank 16+: 10 points
                        const points = Math.max(10, 25 - rank);

                        const current = userScores.get(handle) || { solveCount: 0, points: 0, name: userMap.get(handle)?.name || handle };
                        userScores.set(handle, {
                            solveCount: current.solveCount + 1,
                            points: current.points + points,
                            name: current.name
                        });
                    });
                }
            } catch (err) {
                console.error(`Error fetching status for ${problem.contestId}${problem.index}`, err);
            }
        }

        // 4. Upsert to Supabase
        interface LeaderboardUpdate {
            user_handle: string;
            name: string;
            date: string;
            solve_count: number;
            points: number;
            last_updated: string;
        }
        const updates: LeaderboardUpdate[] = [];
        for (const [handle, stats] of userScores.entries()) {
            updates.push({
                user_handle: handle,
                name: stats.name,
                date: dateStr,
                solve_count: stats.solveCount,
                points: stats.points,
                last_updated: new Date().toISOString()
            });
        }

        if (updates.length > 0) {
            const { error } = await supabase
                .from('daily_leaderboard')
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .upsert(updates as any, { onConflict: 'user_handle, date' });

            if (error) throw error;
        }

        return NextResponse.json({ success: true, updated: updates.length });

    } catch (error: unknown) {
        console.error("Sync error:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
    }
}
