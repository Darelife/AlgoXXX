"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { Session } from "@supabase/supabase-js";

// Types
interface LeaderboardEntry {
    handle: string;
    name: string;
    totalPoints: number;
    totalSolved: number;
    // Map date string (YYYY-MM-DD) to stats
    dailyStats: Record<string, { solved: number; points: number }>;
}

export default function LeaderboardPage() {
    const supabase = useMemo(() => createClient(), []);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [days, setDays] = useState<string[]>([]); // Array of YYYY-MM-DD
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<string | null>(null);

    useEffect(() => {
        // Determine the last 25 days (to match AoC style typically)
        // Or maybe 30 since we fetch 30. Let's do 25 to keep it compact and "AoC-like" specific number
        // Actually the fetch is 30, let's show all 30.
        const now = new Date();
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istNow = new Date(utc + istOffset);

        // We want the columns to be 1..N where 1 is the oldest day?
        // AoC does 1..25 where 1 is Dec 1.
        // Here we have rolling days. 
        // Let's order them Oldest -> Newest (Left -> Right) so it fills up like AoC.
        const dates: string[] = [];
        for (let i = 29; i >= 0; i--) {
            const d = new Date(istNow);
            d.setDate(istNow.getDate() - i);
            dates.push(d.toISOString().split('T')[0]);
        }
        setDays(dates);

        const fetchLeaderboard = async () => {
            setLoading(true);
            try {
                const res = await fetch('/api/daily/history?days=30');
                const historyData = await res.json();

                const leaderboardMap = new Map<string, LeaderboardEntry>();

                historyData.forEach((entry: any) => {
                    if (!leaderboardMap.has(entry.user_handle)) {
                        leaderboardMap.set(entry.user_handle, {
                            handle: entry.user_handle,
                            name: entry.name || entry.user_handle,
                            totalPoints: 0,
                            totalSolved: 0,
                            dailyStats: {}
                        });
                    }

                    const user = leaderboardMap.get(entry.user_handle)!;
                    // Accumulate totals
                    user.totalPoints += entry.points;
                    user.totalSolved += entry.solve_count;

                    // Record daily stat
                    user.dailyStats[entry.date] = {
                        solved: entry.solve_count,
                        points: entry.points
                    };
                });

                const sorted = Array.from(leaderboardMap.values()).sort((a, b) => {
                    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
                    return b.totalSolved - a.totalSolved;
                });

                setLeaderboard(sorted);
            } catch (err) {
                console.error("Failed to load leaderboard", err);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, []);

    // Determine User Name for Header
    useEffect(() => {
        const getUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user?.email) {
                // Ideally fetch the specific user name from DB, but for now just use local storage logic if available or email
                // Reuse logic from main page if needed, but for now just "Guest" or "User"
            }
        };
        getUser();
    }, [supabase]);

    if (loading) {
        return <div className="min-h-screen bg-[#0f0f23] text-green-500 font-mono p-10">Loading leaderboard...</div>;
    }

    return (
        <div className="min-h-screen bg-[#0f0f23] text-[#cccccc] font-mono p-4 md:p-8">
            <div className="max-w-[1200px] mx-auto">
                <header className="mb-8">
                    <h1 className="text-[#ffff66] text-3xl font-bold mb-2 text-shadow-glow">Leaderboard</h1>
                    <div className="text-[#cccccc] mb-4">
                        <Link href="/daily" className="text-green-500 hover:text-[#99ff99]">[Return to Daily Challenges]</Link>
                    </div>
                    <p className="text-[#cccccc]">
                        This is the private leaderboard for <span className="text-white">AlgoManiax Daily</span>.
                        Usage of this leaderboard is for educational purposes.
                        <br />
                        Current event: <span className="text-[#ffff66]">Daily Streak 2025</span>
                    </p>
                    <p className="mt-4 text-sm text-[#888888]">
                        Gold <span className="text-[#ffff66]">*</span> indicates full completion (3/3),
                        Silver <span className="text-[#9999cc]">*</span> means partial (1/2),
                        and Gray <span className="text-[#444444]">*</span> means none.
                    </p>
                </header>

                <div className="overflow-x-auto">
                    {/* Header Rows for Days */}

                    <div className="min-w-max pb-4">

                        {/* Tens digit row */}
                        <div className="flex">
                            <div className="w-[100px] shrink-0"></div> {/* Spacer for Rank + Score */}
                            <div className="flex">
                                {days.map((_, idx) => {
                                    const dayNum = idx + 1;
                                    const tens = Math.floor(dayNum / 10);
                                    return (
                                        <span key={`tens-${idx}`} className="w-[18px] text-center text-[#cccccc] whitespace-pre text-xs">
                                            {tens > 0 ? tens : " "}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Ones digit row */}
                        <div className="flex mb-2">
                            <div className="w-[100px] shrink-0"></div> {/* Spacer for Rank + Score */}
                            <div className="flex">
                                {days.map((_, idx) => {
                                    const dayNum = idx + 1;
                                    const ones = dayNum % 10;
                                    return (
                                        <span key={`ones-${idx}`} className="w-[18px] text-center text-[#cccccc] text-xs">
                                            {ones}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Entries */}
                        {leaderboard.map((user, idx) => (
                            <div key={user.handle} className="flex hover:bg-[#1a1a2e] transition-colors items-center">
                                {/* Rank & Score */}
                                <div className="w-[100px] shrink-0 flex items-center justify-end gap-3 text-[#cccccc] whitespace-nowrap overflow-hidden pr-4">
                                    <span className="text-[#888888] text-sm">{idx + 1})</span>
                                    <span className="font-bold text-white tracking-wider">{user.totalPoints}</span>
                                </div>

                                {/* Stars Grid */}
                                <div className="flex items-center">
                                    {days.map((dayDate) => {
                                        const stats = user.dailyStats[dayDate];
                                        let star = <span className="text-[#333333] select-none scale-75 block">.</span>; // Empty

                                        if (stats) {
                                            if (stats.solved === 3) {
                                                star = <span className="text-[#ffff66] text-shadow-gold text-sm block">*</span>;
                                            } else if (stats.solved >= 1) {
                                                star = <span className="text-[#9999cc] text-shadow-silver text-sm block">*</span>;
                                            }
                                        }

                                        return (
                                            <div key={`${user.handle}-${dayDate}`} className="w-[18px] flex justify-center">
                                                {star}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Name */}
                                <div className="ml-4 truncate text-green-500 hover:text-[#99ff99] transition-colors">
                                    <Link href={`https://codeforces.com/profile/${user.handle}`} target="_blank">
                                        {user.name}
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <style jsx global>{`
        .text-shadow-glow {
          text-shadow: 0 0 5px #00cc00, 0 0 10px #00cc00;
        }
        .text-shadow-gold {
          text-shadow: 0 0 5px #ffff66;
        }
        .text-shadow-silver {
           text-shadow: 0 0 5px #9999cc;
        }
      `}</style>
        </div>
    );
}
