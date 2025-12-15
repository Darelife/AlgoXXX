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
        const istOffsetSec = 5.5 * 60 * 60; // 5.5 hours in seconds

        // Calculate "Day Index" relative to IST
        // Day Index = floor( (Unix Timestamp + IST Offset) / 86400 )
        const currentTimestampSec = Math.floor(now.getTime() / 1000);
        const dayIndex = Math.floor((currentTimestampSec + istOffsetSec) / 86400);

        const randomSeed = dayIndex;

        // Mulberry32 seeded random number generator
        function mulberry32(a: number) {
            return function () {
                let t = a += 0x6D2B79F5;
                t = Math.imul(t ^ (t >>> 15), t | 1);
                t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
                return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
            }
        }

        const rand = mulberry32(randomSeed);

        const problemsRes = await fetch("https://codeforces.com/api/problemset.problems");
        const problemsData = await problemsRes.json();

        if (problemsData.status !== "OK") throw new Error("Failed to fetch problems");

        const allProblems: CFProblem[] = problemsData.result.problems;
        const rated = allProblems.filter((p) => typeof p.rating === "number");

        // Sort deterministically (Exact match with frontend)
        rated.sort((a, b) => {
            if (b.contestId !== a.contestId) return (b.contestId || 0) - (a.contestId || 0);
            return (a.index || "").localeCompare(b.index || "");
        });

        const easyProblems = rated.filter((p) => p.rating! >= 800 && p.rating! <= 1200);
        const mediumProblems = rated.filter((p) => p.rating! >= 1300 && p.rating! <= 1600);
        const hardProblems = rated.filter((p) => p.rating! >= 1700 && p.rating! <= 2000);

        const pick = (arr: CFProblem[]) => {
            if (!arr.length) return null;
            const index = Math.floor(rand() * arr.length);
            return arr[index];
        };

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

        // Start of Day in UTC (for filtering submissions)
        // The start of "dayIndex" occurs when (t + offset) / 86400 == dayIndex (integer division)
        // t_start + offset = dayIndex * 86400
        // t_start = (dayIndex * 86400) - offset
        const startOfDay = (dayIndex * 86400) - istOffsetSec;

        // Calculate Date String (YYYY-MM-DD)
        // The day index usually corresponds to days since epoch if offset was 0. 
        // We want the string representation of that day.
        // new Date(dayIndex * 86400 * 1000) gives us 00:00 UTC on that day.
        // Since we aligned our "day" to be consistent, we can just use the UTC date string of this timestamp.
        const dateObj = new Date(dayIndex * 86400 * 1000);
        const dateStr = dateObj.toISOString().split('T')[0];

        console.log(`[Sync] IST Date: ${dateStr}`);
        console.log(`[Sync] Day Index: ${dayIndex}`);
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
