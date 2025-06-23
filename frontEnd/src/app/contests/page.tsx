"use client";

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, ExternalLink, Trophy, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { motion, useScroll, useTransform } from "framer-motion";
import NavBar from '../components/navBar';
import Image from 'next/image';

interface Contest {
  event: string;
  start: string;
  end: string;
  duration: number;
  host: string;
  href: string;
}

const ContestsPage: React.FC = () => {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState("light");
  const [isMobile, setIsMobile] = useState(false);
  const [transform, setTransform] = useState({ x: 0, y: 0 });

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/iPhone|iPad|iPod|Android|Mobile/i.test(navigator.userAgent) || window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Parallax scroll setup
  const { scrollY } = useScroll();
  const headerY = useTransform(scrollY, [0, 300], isMobile ? [0, 0] : [0, -40]);
  const headerScale = useTransform(scrollY, [0, 300], isMobile ? [1, 1] : [1, 0.95]);
  const bgY = useTransform(scrollY, [0, 300], isMobile ? [0, 0] : [0, 80]);
  
  // Adding rotation transforms for SVG backgrounds
  const rotateLeft = useTransform(scrollY, [0, 1000], isMobile ? [0, -5] : [0, -25]);
  const rotateRight = useTransform(scrollY, [0, 1000], isMobile ? [0, 5] : [0, 25]);

  // Mouse movement effect
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
    
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [isMobile]);

  // Theme toggle function
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
    document.body.classList.toggle("dark", newTheme === "dark");
    localStorage.setItem("theme", newTheme);
  };

  useEffect(() => {
    // Initialize theme from localStorage
    const storedTheme = localStorage.getItem("theme") || "light";
    setTheme(storedTheme);
    document.documentElement.classList.toggle("dark", storedTheme === "dark");
    document.body.classList.toggle("dark", storedTheme === "dark");
    
    // Fetch contests
    fetchContests();
  }, []);

  const fetchContests = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://algoxxx.onrender.com/currentinfo/nextcontest');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Helper function to check if text contains only Latin characters
      const isLatinOnly = (text: string) => {
        // Allow Latin letters, numbers, spaces, and common punctuation
        const latinRegex = /^[a-zA-Z0-9\s\-.,!?()\/&:;'"#@$%^*+=\[\]{}|\\<>~`_]*$/;
        // console.log(text);
        return latinRegex.test(text);
        // return true;
      };
      
      // Filter contests to show only those within 7 days and with Latin characters only
      const now = new Date();
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      console.log("Current time:", now.toISOString());
      console.log("Seven days from now:", sevenDaysFromNow.toISOString());
      
      const filteredContests = data.filter((contest: Contest) => {
        const contestStart = new Date(contest.start);
        console.log(`Contest: ${contest.event}`);
        console.log(`Contest start: ${contestStart.toISOString()}`);
        console.log(`Now: ${now.toISOString()}`);
        console.log(`Seven days from now: ${sevenDaysFromNow.toISOString()}`);
        console.log(`Is within time range: ${contestStart >= now && contestStart <= sevenDaysFromNow}`);
        
        const isWithinTimeRange = contestStart >= now && contestStart <= sevenDaysFromNow;
        const hasLatinTitle = isLatinOnly(contest.event);
        
        return isWithinTimeRange && hasLatinTitle;
      });
      
      // Sort contests by start time (earliest first)
      const sortedContests = filteredContests.sort((a: Contest, b: Contest) => {
        const startA = new Date(a.start);
        const startB = new Date(b.start);
        return startA.getTime() - startB.getTime();
      });
      
      setContests(sortedContests);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch contests');
      console.error('Error fetching contests:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getTimeUntilStart = (startTime: string) => {
    const now = new Date();
    const start = new Date(startTime);
    const diffMs = start.getTime() - now.getTime();
    
    if (diffMs < 0) {
      return 'Started';
    }
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getHostColor = (host: string) => {
    const colors: { [key: string]: string } = {
      'codeforces.com': 'bg-blue-100/80 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      'atcoder.jp': 'bg-orange-100/80 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      'codechef.com': 'bg-yellow-100/80 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      'topcoder.com': 'bg-red-100/80 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      'hackerrank.com': 'bg-green-100/80 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      'leetcode.com': 'bg-purple-100/80 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    };
    
    return colors[host] || 'bg-gray-100/80 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
  };

  if (loading) {
    return (
      <div className={`relative overflow-hidden ${theme === "dark" ? "dark" : ""}`}>
        <NavBar toggleTheme={toggleTheme} fixed={false} />
        
        {/* SVG Background Elements with Parallax Rotation */}
        <div className="fixed inset-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
          {/* Top right rotating SVG */}
          <motion.div 
            className={`absolute -top-20 right-0 ${isMobile ? 'w-64 h-64' : 'w-80 h-80'} opacity-30 dark:opacity-15`}
            style={{ 
              y: bgY,
              rotate: rotateRight,
              willChange: "transform"
            }}
          >
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <path 
                fill={theme === "dark" ? "#ff6b35" : "#ff8c4a"}
                d="M66.4,-69.5C85.2,-55.6,99.7,-31.8,103.3,-6.5C106.9,18.8,99.5,45.5,82.2,61.2C64.9,76.9,37.8,81.5,14.5,77.9C-8.8,74.3,-28.3,62.4,-44.4,47.5C-60.5,32.6,-73.2,14.7,-75.2,-5.3C-77.2,-25.3,-68.3,-47.5,-52.9,-61.2C-37.4,-75,-18.7,-80.5,2.9,-83.9C24.5,-87.3,48.9,-88.7,66.4,-69.5Z" 
                transform="translate(100 100)" 
              />
            </svg>
          </motion.div>
          
          {/* Bottom left rotating SVG */}
          <motion.div 
            className={`absolute bottom-0 -left-20 ${isMobile ? 'w-64 h-64' : 'w-72 h-72'} opacity-30 dark:opacity-15`}
            style={{ 
              y: bgY,
              rotate: rotateLeft,
              willChange: "transform"
            }}
          >
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <path 
                fill={theme === "dark" ? "#ff4500" : "#ff6347"}
                d="M62.6,-37.8C76.4,-17.5,79.8,11.7,69.7,33.8C59.6,55.9,36.1,70.9,11.5,73.4C-13,75.9,-38.7,65.8,-54.3,47.1C-70,28.3,-75.7,0.8,-68,-20.9C-60.3,-42.6,-39.3,-58.4,-17.7,-65C3.9,-71.6,27.1,-69,62.6,-37.8Z" 
                transform="translate(100 100)" 
              />
            </svg>
          </motion.div>
        </div>
        
        {/* Parallax background elements */}
        <motion.div 
          className="absolute inset-0 w-full h-screen pointer-events-none"
          style={{ y: bgY }}
        >
          <div className={`absolute top-20 left-1/4 ${isMobile ? 'w-48 h-48' : 'w-64 h-64'} rounded-full bg-orange-500/10 dark:bg-orange-500/5 blur-3xl`}></div>
          <div className={`absolute bottom-32 right-1/4 ${isMobile ? 'w-64 h-64' : 'w-96 h-96'} rounded-full bg-red-500/10 dark:bg-red-500/5 blur-3xl`}></div>
        </motion.div>

        <div className="flex justify-center items-center min-h-screen">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity, repeatType: "loop" }}
            className="flex items-center gap-2"
          >
            <div className="text-2xl text-gray-600 dark:text-gray-300">Loading</div>
            <motion.div 
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, repeatType: "loop" }}
              className="w-2 h-2 rounded-full bg-orange-500 dark:bg-red-500"
            ></motion.div>
            <motion.div 
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, delay: 0.2, repeat: Infinity, repeatType: "loop" }}
              className="w-2 h-2 rounded-full bg-orange-500 dark:bg-red-500"
            ></motion.div>
            <motion.div 
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, delay: 0.4, repeat: Infinity, repeatType: "loop" }}
              className="w-2 h-2 rounded-full bg-orange-500 dark:bg-red-500"
            ></motion.div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`relative overflow-hidden ${theme === "dark" ? "dark" : ""}`}>
        <NavBar toggleTheme={toggleTheme} fixed={false} />
        
        {/* SVG Background Elements with Parallax Rotation */}
        <div className="fixed inset-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
          <motion.div 
            className={`absolute -top-20 right-0 ${isMobile ? 'w-64 h-64' : 'w-80 h-80'} opacity-30 dark:opacity-15`}
            style={{ 
              y: bgY,
              rotate: rotateRight,
              willChange: "transform"
            }}
          >
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <path 
                fill={theme === "dark" ? "#ff6b35" : "#ff8c4a"}
                d="M66.4,-69.5C85.2,-55.6,99.7,-31.8,103.3,-6.5C106.9,18.8,99.5,45.5,82.2,61.2C64.9,76.9,37.8,81.5,14.5,77.9C-8.8,74.3,-28.3,62.4,-44.4,47.5C-60.5,32.6,-73.2,14.7,-75.2,-5.3C-77.2,-25.3,-68.3,-47.5,-52.9,-61.2C-37.4,-75,-18.7,-80.5,2.9,-83.9C24.5,-87.3,48.9,-88.7,66.4,-69.5Z" 
                transform="translate(100 100)" 
              />
            </svg>
          </motion.div>
          
          <motion.div 
            className={`absolute bottom-0 -left-20 ${isMobile ? 'w-64 h-64' : 'w-72 h-72'} opacity-30 dark:opacity-15`}
            style={{ 
              y: bgY,
              rotate: rotateLeft,
              willChange: "transform"
            }}
          >
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <path 
                fill={theme === "dark" ? "#ff4500" : "#ff6347"}
                d="M62.6,-37.8C76.4,-17.5,79.8,11.7,69.7,33.8C59.6,55.9,36.1,70.9,11.5,73.4C-13,75.9,-38.7,65.8,-54.3,47.1C-70,28.3,-75.7,0.8,-68,-20.9C-60.3,-42.6,-39.3,-58.4,-17.7,-65C3.9,-71.6,27.1,-69,62.6,-37.8Z" 
                transform="translate(100 100)" 
              />
            </svg>
          </motion.div>
        </div>
        
        <motion.div 
          className="absolute inset-0 w-full h-screen pointer-events-none"
          style={{ y: bgY }}
        >
          <div className={`absolute top-20 left-1/4 ${isMobile ? 'w-48 h-48' : 'w-64 h-64'} rounded-full bg-orange-500/10 dark:bg-orange-500/5 blur-3xl`}></div>
          <div className={`absolute bottom-32 right-1/4 ${isMobile ? 'w-64 h-64' : 'w-96 h-96'} rounded-full bg-red-500/10 dark:bg-red-500/5 blur-3xl`}></div>
        </motion.div>

        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center bg-white/70 dark:bg-gray-900/20 backdrop-blur-sm rounded-xl shadow-sm p-8 border border-orange-200/30 dark:border-red-900/20">
            <div className="text-red-500 dark:text-red-400 mb-4">
              <Trophy className="h-12 w-12 mx-auto mb-2" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
              Failed to load contests
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <Button 
              onClick={fetchContests} 
              className="bg-orange-600 hover:bg-orange-700 dark:bg-red-600 dark:hover:bg-red-700 text-white"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${theme === "dark" ? "dark" : ""}`}>
      <NavBar toggleTheme={toggleTheme} fixed={false} />
      
      {/* SVG Background Elements with Parallax Rotation */}
      <div className="fixed inset-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        {/* Top right rotating SVG */}
        <motion.div 
          className={`absolute -top-20 right-0 ${isMobile ? 'w-64 h-64' : 'w-80 h-80'} opacity-30 dark:opacity-15`}
          style={{ 
            y: bgY,
            rotate: rotateRight,
            willChange: "transform"
          }}
        >
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <path 
              fill={theme === "dark" ? "#ff6b35" : "#ff8c4a"}
              d="M66.4,-69.5C85.2,-55.6,99.7,-31.8,103.3,-6.5C106.9,18.8,99.5,45.5,82.2,61.2C64.9,76.9,37.8,81.5,14.5,77.9C-8.8,74.3,-28.3,62.4,-44.4,47.5C-60.5,32.6,-73.2,14.7,-75.2,-5.3C-77.2,-25.3,-68.3,-47.5,-52.9,-61.2C-37.4,-75,-18.7,-80.5,2.9,-83.9C24.5,-87.3,48.9,-88.7,66.4,-69.5Z" 
              transform="translate(100 100)" 
            />
          </svg>
        </motion.div>
        
        {/* Bottom left rotating SVG */}
        <motion.div 
          className={`absolute bottom-0 -left-20 ${isMobile ? 'w-64 h-64' : 'w-72 h-72'} opacity-30 dark:opacity-15`}
          style={{ 
            y: bgY,
            rotate: rotateLeft,
            willChange: "transform"
          }}
        >
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <path 
              fill={theme === "dark" ? "#ff4500" : "#ff6347"}
              d="M62.6,-37.8C76.4,-17.5,79.8,11.7,69.7,33.8C59.6,55.9,36.1,70.9,11.5,73.4C-13,75.9,-38.7,65.8,-54.3,47.1C-70,28.3,-75.7,0.8,-68,-20.9C-60.3,-42.6,-39.3,-58.4,-17.7,-65C3.9,-71.6,27.1,-69,62.6,-37.8Z" 
              transform="translate(100 100)" 
            />
          </svg>
        </motion.div>
      </div>
      
      {/* Parallax background elements */}
      <motion.div 
        className="absolute inset-0 w-full h-screen pointer-events-none"
        style={{ y: bgY }}
      >
        <div className={`absolute top-20 left-1/4 ${isMobile ? 'w-48 h-48' : 'w-64 h-64'} rounded-full bg-orange-500/10 dark:bg-orange-500/5 blur-3xl`}></div>
        <div className={`absolute bottom-32 right-1/4 ${isMobile ? 'w-64 h-64' : 'w-96 h-96'} rounded-full bg-red-500/10 dark:bg-red-500/5 blur-3xl`}></div>
      </motion.div>
      
      <motion.div
        className="relative flex justify-center items-center min-h-screen mb-8"
        style={{ 
          transform: isMobile ? 'none' : `translate(${transform.x}px, ${transform.y}px)`,
          willChange: isMobile ? 'auto' : 'transform'
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="flex flex-col items-center"
          style={{ 
            y: headerY,
            scale: headerScale
          }}
        >
          <motion.h1 
            className="md:text-8xl text-5xl font-sans font-black bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-400 dark:to-red-400 mt-[-10rem]"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Contests
          </motion.h1>
          <motion.p 
            className="mt-4 text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto px-5 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            Stay updated with programming contests happening in the next 7 days.
          </motion.p>
        </motion.div>
      </motion.div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-12">
        {/* Contests Grid */}
        {contests.length === 0 ? (
          <motion.div 
            className="text-center py-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-white/70 dark:bg-gray-900/20 backdrop-blur-sm rounded-xl shadow-sm p-8 border border-orange-200/30 dark:border-red-900/20 max-w-md mx-auto">
              <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                No upcoming contests
              </h2>
              <p className="text-gray-500 dark:text-gray-500">
                No contests scheduled for the next 7 days
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, staggerChildren: 0.1 }}
          >
            {contests.map((contest, index) => (
              <motion.div 
                key={index} 
                className="bg-white/70 dark:bg-gray-700/10 backdrop-blur-sm rounded-xl shadow-sm p-6 border border-orange-200/30 dark:border-red-900/20 hover:shadow-lg transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="space-y-4">
                  {/* Contest Title */}
                  <div>
                    <a
                      href={contest.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block hover:text-orange-600 dark:hover:text-red-400 transition-colors duration-200"
                    >
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white overflow-hidden mb-2 hover:underline" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {contest.event}
                      </h3>
                    </a>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getHostColor(contest.host)}`}>
                      <Globe className="inline h-3 w-3 mr-1" />
                      {contest.host}
                    </span>
                  </div>

                  {/* Contest Details */}
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="h-4 w-4 mr-3 flex-shrink-0 text-orange-600 dark:text-red-400" />
                      <span>Starts: {formatDate(contest.start)}</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Clock className="h-4 w-4 mr-3 flex-shrink-0 text-orange-600 dark:text-red-400" />
                      <span>Duration: {formatDuration(contest.duration)}</span>
                    </div>
                    
                    <div className="flex items-center text-sm font-medium">
                        <div className="h-2 w-2 bg-green-500 rounded-full mr-3 animate-pulse"></div>
                      <span className="text-green-600 dark:text-green-400">
                        Starts in: {getTimeUntilStart(contest.start)}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ContestsPage;
