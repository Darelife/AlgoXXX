"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { Session } from "@supabase/supabase-js";

import NavBar from "../../components/navBar";

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
    const [theme, setTheme] = useState<"light" | "dark">("dark"); // Default to dark for AoC feel

    useEffect(() => {
        // Load theme
        const storedTheme = localStorage.getItem("theme") || "dark";
        setTheme(storedTheme as "light" | "dark");
        document.documentElement.classList.toggle("dark", storedTheme === "dark");

        // Determine the last 25 days (to match AoC style typically)
        // Or maybe 30 since we fetch 30. Let's do 25 to keep it compact and "AoC-like" specific number
        // Actually the fetch is 30, let's show all 30.
        // const now = new Date();
        // // Shift to IST
        // const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        // const istOffset = 5.5 * 60 * 60 * 1000;
        // const istNow = new Date(utc + istOffset);
        const now = new Date();
        console.log(now);
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istNow = new Date(now.getTime() + istOffset);
        console.log(istNow);


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
                // 1. Initial Fetch
                const res = await fetch('/api/daily/history?days=30');
                const historyData = await res.json();
                processAndSetLeaderboard(historyData);
                setLoading(false);

                // 2. Trigger Sync (Background)
                await fetch('/api/daily/sync', { method: 'POST' });

                // 3. Re-fetch
                const updatedRes = await fetch('/api/daily/history?days=30');
                const updatedData = await updatedRes.json();
                processAndSetLeaderboard(updatedData);

            } catch (err) {
                console.error("Failed to load leaderboard", err);
                setLoading(false);
            }
        };

        const processAndSetLeaderboard = (historyData: any[]) => {
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

    const toggleTheme = () => {
        const newTheme = theme === "light" ? "dark" : "light";
        setTheme(newTheme);
        document.documentElement.classList.toggle("dark", newTheme === "dark");
        localStorage.setItem("theme", newTheme);
    };

    if (loading) {
        return (
            <div className={`min-h-screen font-mono p-10 ${theme === 'dark' ? 'bg-[#0a0a0a] text-green-500' : 'bg-white text-green-600'}`}>
                Loading leaderboard...
            </div>
        );
    }

    // Dynamic styles based on theme
    const bgClass = theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-white';
    const textMain = theme === 'dark' ? 'text-[#cccccc]' : 'text-gray-600';
    const textHeader = theme === 'dark' ? 'text-[#ffff66]' : 'text-orange-500'; // Gold/Orange for header
    const textLink = theme === 'dark' ? 'text-green-500 hover:text-[#99ff99]' : 'text-green-600 hover:text-green-800';
    const textRowHover = theme === 'dark' ? 'hover:bg-[#1a1a2e]' : 'hover:bg-gray-100';
    const textRank = theme === 'dark' ? 'text-[#888888]' : 'text-gray-400';
    const textScore = theme === 'dark' ? 'text-white' : 'text-black';
    const cellTens = theme === 'dark' ? 'text-[#cccccc]' : 'text-black';
    const cellOnes = theme === 'dark' ? 'text-[#cccccc]' : 'text-black';
    const starEmpty = theme === 'dark' ? 'text-[#333333]' : 'text-gray-200';

    return (
        <div className={`min-h-screen font-mono ${bgClass} ${textMain}`}>
            <NavBar toggleTheme={toggleTheme} fixed={false} />

            <div className="max-w-[1200px] mx-auto p-4 md:p-8 pt-12">
                <header className="mb-8">
                    <h1 className={`${textHeader} text-3xl font-bold mb-2 ${theme === 'dark' ? 'text-shadow-glow' : ''}`}>Leaderboard</h1>
                    <div className="mb-4">
                        <Link href="/daily" className={textLink}>[Return to Daily Challenges]</Link>
                    </div>
                    <p>
                        This is the private leaderboard for <span className={`${textScore}`}>AlgoManiax Daily</span>.
                        Usage of this leaderboard is for educational purposes.
                        <br />
                        Current event: <span className={`${textHeader}`}>Daily Streak 2025</span>
                    </p>
                    <p className="mt-4 text-sm opacity-80">
                        Gold <span className={`${theme === 'dark' ? 'text-[#ffff66]' : 'text-yellow-500'}`}>*</span> indicates full completion (3/3),
                        Silver <span className={`${theme === 'dark' ? 'text-[#9999cc]' : 'text-slate-400'}`}>*</span> means partial (2/3),
                        and Purple <span className={`${theme === 'dark' ? 'text-[#a855f7]' : 'text-purple-600'}`}>*</span> means started (1/3).
                    </p>
                </header>

                <div className="overflow-x-auto">
                    {/* Header Rows for Days */}

                    <div className="min-w-max pb-4">

                        {/* Tens digit row */}
                        <div className="flex">
                            <div className="w-[100px] shrink-0"></div> {/* Spacer for Rank + Score */}
                            <div className="flex">
                                {days.map((dayDate, idx) => {
                                    // Parse date string YYYY-MM-DD
                                    const dayNum = parseInt(dayDate.split('-')[2]);
                                    const tens = Math.floor(dayNum / 10);
                                    return (
                                        <span key={`tens-${idx}`} className={`w-[18px] text-center whitespace-pre text-xs ${cellTens}`}>
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
                                {days.map((dayDate, idx) => {
                                    const dayNum = parseInt(dayDate.split('-')[2]);
                                    const ones = dayNum % 10;
                                    return (
                                        <span key={`ones-${idx}`} className={`w-[18px] text-center text-xs ${cellOnes}`}>
                                            {ones}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Entries */}
                        {leaderboard.map((user, idx) => (
                            <div key={user.handle} className={`flex transition-colors items-center ${textRowHover}`}>
                                {/* Rank & Score */}
                                <div className="w-[100px] shrink-0 flex items-center justify-end gap-3 whitespace-nowrap overflow-hidden pr-4">
                                    <span className={`${textRank} text-sm`}>{idx + 1})</span>
                                    <span className={`font-bold tracking-wider ${textScore}`}>{user.totalPoints}</span>
                                </div>

                                {/* Stars Grid */}
                                <div className="flex items-center">
                                    {days.map((dayDate) => {
                                        const stats = user.dailyStats[dayDate];
                                        let star = <span className={`${starEmpty} select-none scale-75 block`}>.</span>; // Empty

                                        if (stats) {
                                            if (stats.solved === 3) {
                                                // Gold
                                                const color = theme === 'dark' ? 'text-[#ffff66] text-shadow-gold' : 'text-yellow-500';
                                                star = <span className={`${color} text-sm block`}>*</span>;
                                            } else if (stats.solved === 2) {
                                                // Silver (Was 1-2, now strictly 2)
                                                const color = theme === 'dark' ? 'text-[#9999cc] text-shadow-silver' : 'text-slate-400';
                                                star = <span className={`${color} text-sm block`}>*</span>;
                                            } else if (stats.solved === 1) {
                                                // Purple (New)
                                                const color = theme === 'dark' ? 'text-[#a855f7] text-shadow-purple' : 'text-purple-600';
                                                star = <span className={`${color} text-sm block`}>*</span>;
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
                                <div className={`ml-4 truncate transition-colors ${textLink}`}>
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
        .text-shadow-purple {
            text-shadow: 0 0 5px #a855f7;
        }
      `}</style>
        </div>
    );
}

