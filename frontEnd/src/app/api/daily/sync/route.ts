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

interface DBQuestion {
    date: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    contest_id: number;
    problem_index: string;
}

export async function POST() {
    try {
        const supabase = createClient();
        console.log("[Sync] Starting sync process...");

        // 1. Setup Dates (IST)
        const now = new Date();
        const istOffsetSec = 5.5 * 60 * 60; // 5.5 hours in seconds
        const currentTimestampSec = Math.floor(now.getTime() / 1000);
        const dayIndex = Math.floor((currentTimestampSec + istOffsetSec) / 86400);

        // Calculate "Today" in YYYY-MM-DD
        const getStrDate = (idx: number) => new Date(idx * 86400 * 1000).toISOString().split('T')[0];
        const todayDateStr = getStrDate(dayIndex);

        // Start of Today in UTC (for submission filtering)
        const startOfTodayUTC = (dayIndex * 86400) - istOffsetSec;

        // 2. Fetch Codeforces Problems (Needed for generation)
        const problemsRes = await fetch("https://codeforces.com/api/problemset.problems");
        const problemsData = await problemsRes.json();
        if (problemsData.status !== "OK") throw new Error("Failed to fetch problems from Codeforces");

        const allProblems: CFProblem[] = problemsData.result.problems;

        // Helper: Find problem by ID/Index
        const findProblem = (contestId: number, index: string) =>
            allProblems.find(p => p.contestId === contestId && p.index === index);

        // Helper check for required questions
        const rated = allProblems.filter((p) => typeof p.rating === "number");
        // Sort deterministically to match frontend logic
        rated.sort((a, b) => {
            if (b.contestId !== a.contestId) return (b.contestId || 0) - (a.contestId || 0);
            return (a.index || "").localeCompare(b.index || "");
        });

        const easyProblems = rated.filter((p) => p.rating! >= 800 && p.rating! <= 1200);
        const mediumProblems = rated.filter((p) => p.rating! >= 1300 && p.rating! <= 1600);
        const hardProblems = rated.filter((p) => p.rating! >= 1700 && p.rating! <= 2000);

        // Mulberry32 PRNG
        const mulberry32 = (a: number) => {
            return function () {
                let t = a += 0x6D2B79F5;
                t = Math.imul(t ^ (t >>> 15), t | 1);
                t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
                return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
            }
        };

        // 3. Backfill/Ensure Questions for Last 30 Days
        const lookbackDays = 30;
        const startBackfillIndex = dayIndex - lookbackDays;
        const startDateStr = getStrDate(startBackfillIndex);

        // Fetch existing questions for the range
        console.log(`[Sync] Checking questions range: ${startDateStr} to ${todayDateStr}`);
        const { data: existingRangeQuestions, error: rangeError } = await supabase
            .from('daily_generated_questions')
            .select('*')
            .gte('date', startDateStr)
            .lte('date', todayDateStr)
            .returns<DBQuestion[]>();

        if (rangeError) console.error("Error fetching existing questions:", rangeError);

        const questionMap = new Map<string, DBQuestion[]>();
        existingRangeQuestions?.forEach(q => {
            if (!questionMap.has(q.date)) questionMap.set(q.date, []);
            questionMap.get(q.date)!.push(q);
        });

        const newInserts: any[] = [];
        let todayProblems: CFProblem[] = [];

        for (let i = startBackfillIndex; i <= dayIndex; i++) {
            const currDateStr = getStrDate(i);
            const questions = questionMap.get(currDateStr) || [];

            const hasEasy = questions.find(q => q.difficulty === "Easy");
            const hasMedium = questions.find(q => q.difficulty === "Medium");
            const hasHard = questions.find(q => q.difficulty === "Hard");

            // Needed?
            const needsEasy = !hasEasy;
            const needsMedium = !hasMedium;
            const needsHard = !hasHard;

            if (!needsEasy && !needsMedium && !needsHard) {
                // All exist
                if (i === dayIndex) {
                    // Populate todayProblems
                    const p1 = findProblem(hasEasy!.contest_id, hasEasy!.problem_index);
                    const p2 = findProblem(hasMedium!.contest_id, hasMedium!.problem_index);
                    const p3 = findProblem(hasHard!.contest_id, hasHard!.problem_index);
                    if (p1 && p2 && p3) todayProblems = [p1, p2, p3];
                }
                continue;
            }

            // Generate
            const rand = mulberry32(i); // Seed = dayIndex
            const pick = (arr: CFProblem[]) => arr.length ? arr[Math.floor(rand() * arr.length)] : null;

            const genEasy = pick(easyProblems);
            const genMedium = pick(mediumProblems);
            const genHard = pick(hardProblems);

            // Determine final problems for this day
            const finalEasy = hasEasy ? findProblem(hasEasy.contest_id, hasEasy.problem_index) : genEasy;
            const finalMedium = hasMedium ? findProblem(hasMedium.contest_id, hasMedium.problem_index) : genMedium;
            const finalHard = hasHard ? findProblem(hasHard.contest_id, hasHard.problem_index) : genHard;

            // Prepare Inserts
            if (needsEasy && finalEasy) {
                newInserts.push({ date: currDateStr, difficulty: 'Easy', contest_id: finalEasy.contestId, problem_index: finalEasy.index });
            }
            if (needsMedium && finalMedium) {
                newInserts.push({ date: currDateStr, difficulty: 'Medium', contest_id: finalMedium.contestId, problem_index: finalMedium.index });
            }
            if (needsHard && finalHard) {
                newInserts.push({ date: currDateStr, difficulty: 'Hard', contest_id: finalHard.contestId, problem_index: finalHard.index });
            }

            // Capture Today's problems
            if (i === dayIndex) {
                if (finalEasy && finalMedium && finalHard) {
                    todayProblems = [finalEasy, finalMedium, finalHard];
                }
            }
        }

        // 4. Persist New Questions
        if (newInserts.length > 0) {
            console.log(`[Sync] Persisting ${newInserts.length} new questions...`);
            const { error: insertError } = await (supabase
                .from('daily_generated_questions') as any)
                .insert(newInserts);

            if (insertError) console.error("Error persisting questions:", insertError);
            else console.log("[Sync] Persistence successful.");
        } else {
            console.log("[Sync] No new questions to generate.");
        }


        // 5. Update Leaderboard (Only for Today)
        console.log(`[Sync] Processing leaderboard for today (${todayDateStr})...`);

        // Fetch Users
        const usersRes = await fetch("https://algoxxx.onrender.com/database");
        const usersData: DBUser[] = await usersRes.json();
        const userMap = new Map<string, DBUser>();
        usersData.forEach(u => userMap.set(u.cfid.toLowerCase().trim(), u));

        if (!todayProblems.length) {
            console.log("[Sync] No problems for today found/generated. Skipping leaderboard.");
            return NextResponse.json({ success: true, message: "Questions sync complete. No leaderboard update." });
        }

        const userScores = new Map<string, { solveCount: number, points: number, name: string }>();

        for (const problem of todayProblems) {
            if (!problem.contestId || !problem.index) continue;

            try {
                const apiUrl = `https://codeforces.com/api/contest.status?contestId=${problem.contestId}&from=1&count=10000`;
                // console.log(`[Sync] Fetching ${apiUrl}`);
                const statusRes = await fetch(apiUrl);
                const statusData = await statusRes.json();

                if (statusData.status === "OK") {
                    const submissions = statusData.result;
                    const problemSolvers = new Map<string, number>();

                    for (const sub of submissions) {
                        // Filter by time: Must be after start of today
                        if (sub.creationTimeSeconds < startOfTodayUTC) break;

                        if (sub.verdict === "OK" && sub.problem.index === problem.index) {
                            for (const author of sub.author.members) {
                                const handle = author.handle.toLowerCase().trim();
                                if (userMap.has(handle)) {
                                    const existingTime = problemSolvers.get(handle);
                                    if (!existingTime || sub.creationTimeSeconds < existingTime) {
                                        problemSolvers.set(handle, sub.creationTimeSeconds);
                                    }
                                }
                            }
                        }
                    }

                    // Score calculation
                    const sortedSolvers = Array.from(problemSolvers.entries()).sort((a, b) => a[1] - b[1]);
                    sortedSolvers.forEach(([handle, _], index) => {
                        const rank = index + 1;
                        const points = Math.max(10, 25 - rank);

                        const current = userScores.get(handle) || { solveCount: 0, points: 0, name: userMap.get(handle)?.name || handle };
                        userScores.set(handle, {
                            solveCount: current.solveCount + 1,
                            points: current.points + points,
                            name: current.name
                        });
                    });
                }
            } catch (e) {
                console.error(`[Sync] Error processing problem ${problem.contestId}${problem.index}`, e);
            }
        }

        // Upsert Leaderboard
        const updates = Array.from(userScores.entries()).map(([handle, stats]) => ({
            user_handle: handle,
            name: stats.name,
            date: todayDateStr,
            solve_count: stats.solveCount,
            points: stats.points,
            last_updated: new Date().toISOString()
        }));

        if (updates.length > 0) {
            const { error: lbError } = await supabase
                .from('daily_leaderboard')
                .upsert(updates as any, { onConflict: 'user_handle, date' });

            if (lbError) console.error("Error updating leaderboard:", lbError);
            else console.log(`[Sync] Updated leaderboard with ${updates.length} entries.`);
        }

        return NextResponse.json({ success: true, generated: newInserts.length, leaderboardUpdates: updates.length });

    } catch (error: any) {
        console.error("[Sync] Critical Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
