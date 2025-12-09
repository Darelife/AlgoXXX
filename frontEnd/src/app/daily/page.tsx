"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Session } from "@supabase/supabase-js";
import NavBar from "../components/navBar";
import { Star, LogIn, AlertCircle } from "lucide-react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

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

interface LeaderboardEntry {
  handle: string;
  name: string;
  totalPoints: number;
  totalSolved: number;
}

interface DailyQuestion {
  problem: CFProblem;
  type: "Easy" | "Medium" | "Hard";
}

interface DayEntry {
  date: string; // YYYY-MM-DD
  displayDate: string;
  questions: DailyQuestion[];
  solvedCount: number;
  points: number;
  isToday: boolean;
}

export default function DailyRoute() {
  const supabase = useMemo(() => createClient(), []);

  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [days, setDays] = useState<DayEntry[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [userHandle, setUserHandle] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // UI State
  const [isAnimating, setIsAnimating] = useState(false);
  const [overlayColor, setOverlayColor] = useState("#121212");
  const [transform, setTransform] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/iPhone|iPad|iPod|Android|Mobile/i.test(navigator.userAgent) || window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Parallax
  const { scrollY } = useScroll();
  const bgY = useTransform(scrollY, [0, 300], isMobile ? [0, 0] : [0, 80]);
  const rotateLeft = useTransform(scrollY, [0, 1000], isMobile ? [0, -5] : [0, -25]);


  // Mouse move
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (isMobile) return;
      const { clientX, clientY } = event;
      const { innerWidth, innerHeight } = window;
      const offsetX = (clientX / innerWidth - 0.5) * -20;
      const offsetY = (clientY / innerHeight - 0.5) * -20;
      setTransform({ x: offsetX, y: offsetY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isMobile]);

  // Theme & Auth
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") || "light";
    setTheme(storedTheme as "light" | "dark");
    document.documentElement.classList.toggle("dark", storedTheme === "dark");
    document.body.classList.toggle("dark", storedTheme === "dark");

    const verifyUser = async (session: Session) => {
      try {
        if (session?.user?.email) {
          const email = session.user.email.toLowerCase();
          const usersRes = await fetch("https://algoxxx.onrender.com/database");
          const usersData: DBUser[] = await usersRes.json();

          const foundUser = usersData.find(u => {
            if (!u.bitsid || u.bitsid.length < 12) return false;
            const expectedEmail = `f${u.bitsid.substring(0, 4)}${u.bitsid.substring(8, 12)}@goa.bits-pilani.ac.in`.toLowerCase();
            return expectedEmail === email;
          });

          if (foundUser) {
            setUserHandle(foundUser.cfid);
            localStorage.setItem("verifiedUserHandle", foundUser.cfid);
            setAuthError(null);
          } else {
            setAuthError("User not found in Algo DB. Please verify your Codeforces handle first.");
            setUserHandle(null);
          }
        }
      } catch (err) {
        console.error("Error verifying user", err);
        setAuthError("Error connecting to database.");
      } finally {
        setIsAuthChecking(false);
      }
    };

    const localHandle = localStorage.getItem("verifiedUserHandle");
    if (localHandle) {
      setUserHandle(localHandle);
      setIsAuthChecking(false);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, session: Session | null) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session) await verifyUser(session);
      } else if (event === 'INITIAL_SESSION') {
        if (session) await verifyUser(session);
        else if (!localStorage.getItem("verifiedUserHandle")) setIsAuthChecking(false);
      } else if (event === 'SIGNED_OUT') {
        setUserHandle(null);
        localStorage.removeItem("verifiedUserHandle");
        setIsAuthChecking(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleLogin = async () => {
    try {
      setLoginLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}${window.location.pathname}`,
          queryParams: { prompt: 'select_account', hd: 'goa.bits-pilani.ac.in' }
        }
      });
      if (error) throw error;
    } catch (err) {
      console.error("Login error:", err);
      setAuthError("Failed to initiate login.");
      setLoginLoading(false);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setOverlayColor(newTheme === "dark" ? "#121212" : "#ffffff");
    setIsAnimating(true);
    setTimeout(() => {
      setTheme(newTheme);
      document.documentElement.classList.toggle("dark", newTheme === "dark");
      document.body.classList.toggle("dark", newTheme === "dark");
      localStorage.setItem("theme", newTheme);
    }, 900);
    setTimeout(() => setIsAnimating(false), 2000);
  };

  // Helper to generate problems for a specific date
  const generateProblemsForDate = (dateUnix: number, easy: CFProblem[], medium: CFProblem[], hard: CFProblem[]) => {
    const randomSeed = Math.floor(dateUnix / 86400);

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

    const pick = (arr: CFProblem[]) => {
      if (!arr.length) return null;
      const index = Math.floor(rand() * arr.length);
      return arr[index];
    };

    const p1 = pick(easy);
    const p2 = pick(medium);
    const p3 = pick(hard);

    if (!p1 || !p2 || !p3) return [];

    return [
      { problem: p1, type: "Easy" as const },
      { problem: p2, type: "Medium" as const },
      { problem: p3, type: "Hard" as const },
    ];
  };

  // Main Data Fetch
  useEffect(() => {
    const processAndSetData = (historyData: any[], problemsData: any) => {
      if (problemsData.status !== "OK") throw new Error("Failed to fetch problems");

      const allProblems: CFProblem[] = problemsData.result.problems;
      const rated = allProblems.filter((p) => typeof p.rating === "number");

      // Sort deterministically
      rated.sort((a, b) => {
        if (b.contestId !== a.contestId) return (b.contestId || 0) - (a.contestId || 0);
        return (a.index || "").localeCompare(b.index || "");
      });

      const easy = rated.filter((p) => p.rating! >= 800 && p.rating! <= 1200);
      const medium = rated.filter((p) => p.rating! >= 1300 && p.rating! <= 1600);
      const hard = rated.filter((p) => p.rating! >= 1700 && p.rating! <= 2000);

      // 4. Process Days
      const processedDays: DayEntry[] = [];
      const now = new Date();
      // Shift to IST
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      const istOffset = 5.5 * 60 * 60 * 1000;
      const istNow = new Date(utc + istOffset);
      const todayStr = istNow.toISOString().split('T')[0];

      // Map history for quick lookup
      const userHistoryMap = new Map<string, { solve_count: number, points: number }>();
      const leaderboardMap = new Map<string, { totalPoints: number, totalSolved: number, name: string }>();

      interface HistoryEntry {
        user_handle: string;
        name: string;
        date: string;
        solve_count: number;
        points: number;
      }

      // Process history data
      historyData.forEach((entry: HistoryEntry) => {
        // Build Leaderboard
        const current = leaderboardMap.get(entry.user_handle) || { totalPoints: 0, totalSolved: 0, name: entry.name || entry.user_handle };
        leaderboardMap.set(entry.user_handle, {
          totalPoints: current.totalPoints + entry.points,
          totalSolved: current.totalSolved + entry.solve_count,
          name: entry.name || entry.user_handle // Use name if available, else handle
        });

        // Store current user's daily stats
        if (entry.user_handle.toLowerCase() === userHandle!.toLowerCase()) {
          userHistoryMap.set(entry.date, { solve_count: entry.solve_count, points: entry.points });
        }
      });

      // Generate last 30 days (IST based)
      for (let i = 0; i < 30; i++) {
        const d = new Date(istNow); // Start from IST current date
        d.setDate(istNow.getDate() - i); // Subtract days from IST current date

        const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD for this IST day
        const displayDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const isToday = dateStr === todayStr;

        // Use noon time to avoid timezone edge cases for seed
        // This date object 'd' is already in IST, so its getTime() will reflect IST.
        // We want the noon of *this specific IST day* for the seed.
        const noonTime = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0).getTime() / 1000;
        const questions = generateProblemsForDate(noonTime, easy, medium, hard);

        const stats = userHistoryMap.get(dateStr) || { solve_count: 0, points: 0 };

        processedDays.push({
          date: dateStr,
          displayDate,
          questions,
          solvedCount: stats.solve_count,
          points: stats.points,
          isToday
        });
      }

      setDays(processedDays);

      // 5. Set Leaderboard
      const sortedLeaderboard = Array.from(leaderboardMap.entries())
        .map(([handle, stats]) => ({ handle, ...stats }))
        .sort((a, b) => b.totalPoints - a.totalPoints);

      setLeaderboard(sortedLeaderboard);
    };

    const fetchData = async () => {
      if (!userHandle) return;

      setDataLoading(true);
      try {
        // 1. Fetch History & Problems immediately (Fast)
        const [historyRes, problemsRes] = await Promise.all([
          fetch('/api/daily/history?days=30'),
          fetch("https://codeforces.com/api/problemset.problems")
        ]);

        const historyData = await historyRes.json();
        const problemsData = await problemsRes.json();

        // Render immediately with existing data
        processAndSetData(historyData, problemsData);
        setDataLoading(false);

        // 2. Trigger Sync in background (Slow)
        // We don't await this for the initial render, but we await it for the update
        await fetch('/api/daily/sync', { method: 'POST' });

        // 3. Re-fetch History after sync
        const updatedHistoryRes = await fetch('/api/daily/history?days=30');
        const updatedHistoryData = await updatedHistoryRes.json();

        // Re-render with updated data (using same problems data)
        processAndSetData(updatedHistoryData, problemsData);

      } catch (err) {
        console.error("Error fetching data:", err);
        setDataLoading(false);
      }
    };

    fetchData();
  }, [userHandle]);

  const getLink = (day: DayEntry, segmentIndex: number, override?: boolean) => {
    if (!day.questions || day.questions.length === 0) return "#";
    const { questions, solvedCount } = day;

    // Logic:
    // 0 solved: All -> Easy
    // 1 solved: 0->Easy, 1->Medium, 2->Medium
    // 2 solved: 0->Easy, 1->Medium, 2->Hard
    // 3 solved: All -> respective

    if (solvedCount === 0 && !override) return `https://codeforces.com/contest/${questions[0].problem.contestId}/problem/${questions[0].problem.index}`;
    if (solvedCount === 1 && !override) {
      if (segmentIndex === 0) return `https://codeforces.com/contest/${questions[0].problem.contestId}/problem/${questions[0].problem.index}`;
      return `https://codeforces.com/contest/${questions[1].problem.contestId}/problem/${questions[1].problem.index}`;
    }

    if (solvedCount >= 2 || override) {
      if (segmentIndex === 0) return `https://codeforces.com/contest/${questions[0].problem.contestId}/problem/${questions[0].problem.index}`;
      if (segmentIndex === 1) return `https://codeforces.com/contest/${questions[1].problem.contestId}/problem/${questions[1].problem.index}`;
      return `https://codeforces.com/contest/${questions[2].problem.contestId}/problem/${questions[2].problem.index}`;
    }

    return "#";
  };

  return (
    <div className={`relative overflow-hidden min-h-screen font-mono ${theme === "dark" ? "dark bg-[#121212] text-[#cccccc]" : "bg-white text-gray-800"}`}>
      {isAnimating && (
        <div
          className="fixed inset-0 z-50 transition-transform duration-[1000ms] ease-[cubic-bezier(0.4, 0, 0.2, 1)] transform translate-x-0 animate-slide"
          style={{ backgroundColor: overlayColor }}
        ></div>
      )}

      <NavBar toggleTheme={toggleTheme} fixed={false} />

      {/* SVG Background Elements */}
      <div className="fixed inset-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <motion.div
          className="absolute -top-32 -left-32 w-96 h-96 opacity-20 dark:opacity-10"
          style={{ y: bgY, rotate: rotateLeft }}
        >
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <path fill={theme === "dark" ? "#ff4500" : "#ff6347"} d="M38.8,-66.8C51.9,-59.6,65.4,-51.8,71.2,-39.8C77,-27.9,75.1,-12,74.5,4.2C73.9,20.3,74.5,36.8,67.1,48.2C59.6,59.5,44.1,65.8,28.7,71.5C13.3,77.2,-2,82.3,-13.4,76.6C-24.9,70.9,-32.4,54.6,-40.6,42C-48.8,29.4,-57.7,20.5,-62.4,9.4C-67.1,-1.8,-67.5,-15,-64.7,-29.2C-61.9,-43.4,-55.9,-58.7,-44.6,-66.6C-33.3,-74.5,-16.7,-75.1,-1.4,-72.8C13.9,-70.6,27.7,-65.5,38.8,-66.8Z" transform="translate(100 100)" />
          </svg>
        </motion.div>
        {/* ... other SVGs ... */}
      </div>

      <motion.div
        className="max-w-5xl mx-auto px-4 pt-12 pb-20 relative z-10"
        style={{
          transform: isMobile ? 'none' : `translate(${transform.x}px, ${transform.y}px)`,
          willChange: isMobile ? 'auto' : 'transform'
        }}
      >

        {/* Header */}
        <div className="flex flex-col items-center mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-orange-500 dark:text-yellow-500 drop-shadow-[0_0_5px_rgba(255,165,0,0.5)] mb-4">
            AlgoX Daily
          </h1>
          <div className="text-lg text-green-600 dark:text-green-400">
            &lt; Solve your way to the stars /&gt;
          </div>
        </div>

        {isAuthChecking ? (
          <div className="text-center py-12 animate-pulse text-green-500">
            [ Authenticating... ]
          </div>
        ) : !userHandle ? (
          <Card className="max-w-md mx-auto bg-card/50 backdrop-blur-sm border-border">
            <CardHeader>
              <CardTitle className="text-center text-xl text-foreground">Login Required</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-center text-muted-foreground">
                Please login with your BITS ID to view the daily challenge and track your progress.
              </p>
              {authError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{authError}</AlertDescription>
                </Alert>
              )}
              <Button
                onClick={handleLogin}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium py-2"
                disabled={loginLoading}
              >
                {loginLoading ? "Signing in..." : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Login with Google
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Days Table */}
            {dataLoading ? (
              <div className="text-center py-12 animate-pulse text-green-500">
                [ Loading daily challenges... ]
              </div>
            ) : (
              <Card className="mb-20 bg-card/50 backdrop-blur-sm border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="w-[150px]">Date</TableHead>
                        <TableHead className="text-center">Easy</TableHead>
                        <TableHead className="text-center">Medium</TableHead>
                        <TableHead className="text-center">Hard</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {days.map((day) => {
                        // Special handling for TODAY row to create the merged overlay effect
                        if (day.isToday && day.solvedCount < 2) {
                          return (
                            <TableRow
                              key={day.date}
                              className="border-border hover:bg-muted/50 bg-primary/5 relative group"
                            >
                              <TableCell className="font-medium">
                                <div className="flex flex-col">
                                  <span className="text-primary font-bold">
                                    {day.displayDate}
                                  </span>
                                  <span className="text-xs text-muted-foreground">{day.date}</span>
                                  <Badge variant="default" className="w-fit mt-1 text-[10px] h-5 px-1.5">TODAY</Badge>
                                </div>
                              </TableCell>

                              {/* 
                                Logic for Merged Cells:
                                - If 0 solved: Merge all 3 (Easy, Med, Hard) -> Link to Easy
                                - If 1 solved: Easy is separate. Merge Med & Hard -> Link to Medium
                              */}

                              {day.solvedCount === 0 ? (
                                <TableCell colSpan={3} className="p-0 relative h-16">
                                  {/* Background Visuals (Simulated Columns) */}
                                  <div className="absolute inset-0 flex opacity-50">
                                    <div className="flex-1 flex items-center justify-center border-r border-border/50 text-muted-foreground">
                                      Easy
                                    </div>
                                    <div className="flex-1 flex items-center justify-center border-r border-border/50 text-muted-foreground">
                                      Medium
                                    </div>
                                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                                      Hard
                                    </div>
                                  </div>

                                  {/* Overlay Link */}
                                  <Link
                                    href={getLink(day, 0)}
                                    target="_blank"
                                    className="absolute inset-0 z-10 flex items-center justify-center bg-background/10 hover:bg-background/80 backdrop-blur-[1px] transition-all duration-300 group-hover:backdrop-blur-[2px]"
                                  >
                                    <span className="text-primary font-bold tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
                                      [ START CHALLENGE ]
                                    </span>
                                  </Link>
                                </TableCell>
                              ) : (
                                // solvedCount === 1
                                <>
                                  {/* Easy (Completed) */}
                                  <TableCell className="text-center p-0">
                                    <Link
                                      href={getLink(day, 0)}
                                      target="_blank"
                                      className="flex items-center justify-center h-full w-full py-4 text-purple-500 hover:bg-purple-500/10 transition-colors"
                                    >
                                      <Star className="w-5 h-5 fill-purple-500" />
                                    </Link>
                                  </TableCell>

                                  {/* Merged Medium & Hard */}
                                  <TableCell colSpan={2} className="p-0 relative h-16">
                                    {/* Background Visuals */}
                                    <div className="absolute inset-0 flex opacity-50">
                                      <div className="flex-1 flex items-center justify-center border-r border-border/50 text-muted-foreground">
                                        Medium
                                      </div>
                                      <div className="flex-1 flex items-center justify-center text-muted-foreground">
                                        Hard
                                      </div>
                                    </div>

                                    {/* Overlay Link */}
                                    <Link
                                      href={getLink(day, 1)}
                                      target="_blank"
                                      className="absolute inset-0 z-10 flex items-center justify-center bg-background/10 hover:bg-background/80 backdrop-blur-[1px] transition-all duration-300 group-hover:backdrop-blur-[2px]"
                                    >
                                      <span className="text-primary font-bold tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
                                        [ CONTINUE ]
                                      </span>
                                    </Link>
                                  </TableCell>
                                </>
                              )}

                              <TableCell className="text-right">
                                <div className="flex flex-col items-end gap-1">
                                  <span className="text-primary font-bold font-mono">
                                    {day.points} pts
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {day.solvedCount}/3 Solved
                                  </span>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        }

                        // Standard Row Rendering (Past days or Today with >= 2 solved)
                        return (
                          <TableRow
                            key={day.date}
                            className={`border-border hover:bg-muted/50 ${day.isToday ? "bg-primary/5" : ""}`}
                          >
                            <TableCell className="font-medium">
                              <div className="flex flex-col">
                                <span className={day.isToday ? "text-primary font-bold" : "text-foreground"}>
                                  {day.displayDate}
                                </span>
                                <span className="text-xs text-muted-foreground">{day.date}</span>
                                {day.isToday && (
                                  <Badge variant="default" className="w-fit mt-1 text-[10px] h-5 px-1.5">TODAY</Badge>
                                )}
                              </div>
                            </TableCell>

                            {/* Easy Problem */}
                            <TableCell className="text-center p-0">
                              {day.questions && day.questions[0] ? (
                                <Link
                                  href={getLink(day, 0, true)}
                                  target="_blank"
                                  className={`flex items-center justify-center h-full w-full py-4 transition-colors
                                    ${day.solvedCount >= 1
                                      ? "text-purple-500 hover:bg-purple-500/10"
                                      : "text-muted-foreground hover:text-primary hover:bg-muted/50"
                                    }
                                  `}
                                >
                                  {day.solvedCount >= 1 ? <Star className="w-5 h-5 fill-purple-500" /> : "Easy"}
                                </Link>
                              ) : "-"}
                            </TableCell>

                            {/* Medium Problem */}
                            <TableCell className="text-center p-0">
                              {day.questions && day.questions[1] ? (
                                <Link
                                  href={getLink(day, 1, true)}
                                  target="_blank"
                                  className={`flex items-center justify-center h-full w-full py-4 transition-colors
                                    ${day.solvedCount >= 2
                                      ? "text-gray-400 hover:bg-gray-400/10"
                                      : "text-primary hover:bg-primary/10"
                                    //  day.solvedCount === 1
                                    //   ? "text-primary hover:bg-primary/10" // Next up
                                    //   : "text-muted-foreground/30 pointer-events-none" // Locked
                                    }
                                  `}
                                >
                                  {day.solvedCount >= 2 ? <Star className="w-5 h-5 fill-gray-400" /> : "Medium"}
                                </Link>
                              ) : "-"}
                            </TableCell>

                            {/* Hard Problem */}
                            <TableCell className="text-center p-0">
                              {day.questions && day.questions[2] ? (
                                <Link
                                  href={getLink(day, 2, true)}
                                  target="_blank"
                                  className={`flex items-center justify-center h-full w-full py-4 transition-colors
                                    ${day.solvedCount >= 3
                                      ? "text-yellow-500 hover:bg-yellow-500/10"
                                      : "text-primary hover:bg-primary/10"
                                    // day.solvedCount === 2
                                    //   ? "text-primary hover:bg-primary/10" // Next up
                                    //   : "text-muted-foreground/30 pointer-events-none" // Locked
                                    }
                                  `}
                                >
                                  {day.solvedCount >= 3 ? <Star className="w-5 h-5 fill-yellow-500" /> : "Hard"}
                                </Link>
                              ) : "-"}
                            </TableCell>

                            <TableCell className="text-right">
                              <div className="flex flex-col items-end gap-1">
                                <span className={`font-bold font-mono ${day.solvedCount === 3 ? "text-yellow-500" :
                                  day.solvedCount > 0 ? "text-primary" : "text-muted-foreground"
                                  }`}>
                                  {day.points} pts
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {day.solvedCount}/3 Solved
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            )}

            {/* Monthly Leaderboard */}
            <div className="mt-16">
              <h2 className="text-2xl font-bold text-foreground mb-6 border-b border-border pb-2 flex items-center gap-2">
                <span className="text-primary">#</span> Monthly Leaderboard (Last 30 Days)
              </h2>

              <Card className="bg-card/50 backdrop-blur-sm border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="w-[100px]">Rank</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead className="text-right">Total Score</TableHead>
                      <TableHead className="text-right">Total Solved</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaderboard.map((user, idx) => (
                      <TableRow key={user.handle} className="border-border hover:bg-muted/50">
                        <TableCell className="font-medium text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell>
                          <Link
                            href={`https://codeforces.com/profile/${user.handle}`}
                            target="_blank"
                            className={`font-bold hover:underline ${idx < 3 ? "text-yellow-500" : "text-foreground"}`}
                          >
                            {user.name}
                          </Link>
                        </TableCell>
                        <TableCell className="text-right text-primary font-mono">
                          {user.totalPoints}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {user.totalSolved}
                        </TableCell>
                      </TableRow>
                    ))}
                    {leaderboard.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                          No active solvers yet. Be the first!
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            </div>
          </>
        )}

      </motion.div>
    </div>
  );
}