"use client";

import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from "framer-motion";
import NavBar from '../components/navBar';

const ContestPage: React.FC = () => {
  const [leaveCount, setLeaveCount] = useState(0);
  const [theme, setTheme] = useState("light");
  const [isMobile, setIsMobile] = useState(false);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
    document.body.classList.toggle("dark", newTheme === "dark");
    localStorage.setItem("theme", newTheme);
  };

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
  const bgY = useTransform(scrollY, [0, 300], isMobile ? [0, 0] : [0, 80]);
  const rotateLeft = useTransform(scrollY, [0, 1000], isMobile ? [0, -5] : [0, -25]);
  const rotateRight = useTransform(scrollY, [0, 1000], isMobile ? [0, 5] : [0, 25]);

  useEffect(() => {
    // Initialize theme from localStorage
    const storedTheme = localStorage.getItem("theme") || "light";
    setTheme(storedTheme);
    document.documentElement.classList.toggle("dark", storedTheme === "dark");
    document.body.classList.toggle("dark", storedTheme === "dark");
  }, []);

  useEffect(() => {
    // Handle visibility change
    const handleVisibilityChange = () => {
      const isNowVisible = !document.hidden;

      // Only count as "left" when transitioning from visible to hidden
      if (!isNowVisible) {
        setLeaveCount((prevCount) => prevCount + 1);
      }
    };

    // Handle focus change (when user switches to different tab/app)
    const handleBlur = () => {
      setLeaveCount((prevCount) => prevCount + 1);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  return (
    <div className={`relative overflow-hidden ${theme === "dark" ? "dark" : ""}`}>
      <NavBar toggleTheme={toggleTheme} fixed={false}/>

      {/* SVG Background Elements with Parallax Rotation */}
      <div className="fixed inset-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        {/* Top left rotating SVG */}
        <motion.div 
          className="absolute -top-32 -left-32 w-96 h-96 opacity-20 dark:opacity-10"
          style={{ 
            y: bgY,
            rotate: rotateLeft,
          }}
        >
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <path 
              fill={theme === "dark" ? "#ff4500" : "#ff6347"} 
              d="M38.8,-66.8C51.9,-59.6,65.4,-51.8,71.2,-39.8C77,-27.9,75.1,-12,74.5,4.2C73.9,20.3,74.5,36.8,67.1,48.2C59.6,59.5,44.1,65.8,28.7,71.5C13.3,77.2,-2,82.3,-13.4,76.6C-24.9,70.9,-32.4,54.6,-40.6,42C-48.8,29.4,-57.7,20.5,-62.4,9.4C-67.1,-1.8,-67.5,-15,-64.7,-29.2C-61.9,-43.4,-55.9,-58.7,-44.6,-66.6C-33.3,-74.5,-16.7,-75.1,-1.4,-72.8C13.9,-70.6,27.7,-65.5,38.8,-66.8Z" 
              transform="translate(100 100)" 
            />
          </svg>
        </motion.div>
        
        {/* Top right rotating SVG */}
        <motion.div 
          className="absolute -top-20 right-0 w-80 h-80 opacity-20 dark:opacity-10"
          style={{ 
            y: bgY,
            rotate: rotateRight,
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
          className="absolute bottom-0 -left-20 w-72 h-72 opacity-20 dark:opacity-10"
          style={{ 
            y: bgY,
            rotate: rotateRight,
          }}
        >
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <path 
              fill={theme === "dark" ? "#e61919" : "#ff3333"} 
              d="M62.6,-37.8C76.4,-17.5,79.8,11.7,69.7,33.8C59.6,55.9,36.1,70.9,11.5,73.4C-13,75.9,-38.7,65.8,-54.3,47.1C-70,28.3,-75.7,0.8,-68,-20.9C-60.3,-42.6,-39.3,-58.4,-17.7,-65C3.9,-71.6,27.1,-69,62.6,-37.8Z" 
              transform="translate(100 100)" 
            />
          </svg>
        </motion.div>
        
        {/* Bottom right rotating SVG */}
        <motion.div 
          className="absolute bottom-0 right-0 w-96 h-96 opacity-20 dark:opacity-10"
          style={{ 
            y: bgY,
            rotate: rotateLeft,
          }}
        >
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <path 
              fill={theme === "dark" ? "#cc3300" : "#ff5722"} 
              d="M44.1,-70.5C58.4,-62.3,72.1,-51.4,80.2,-36.6C88.3,-21.8,90.8,-3.2,85.8,12.7C80.7,28.5,68.2,41.7,54.3,53.8C40.5,65.9,25.3,77.1,7.3,79.8C-10.6,82.5,-31.5,76.8,-48.2,65.5C-64.9,54.2,-77.4,37.2,-81.7,18.6C-86.1,0,-82.3,-20.3,-72.3,-36.5C-62.2,-52.6,-45.9,-64.7,-29.9,-72.2C-13.9,-79.7,1.9,-82.7,15.7,-78.5C29.5,-74.4,44.1,-70.5,44.1,-70.5Z" 
              transform="translate(100 100) scale(1.05)" 
            />
          </svg>
        </motion.div>
      </div>

      {/* Parallax background blur elements */}
      <motion.div 
        className="fixed inset-0 w-full h-screen pointer-events-none"
        style={{ y: bgY }}
      >
        <div className="absolute top-20 left-1/4 w-64 h-64 rounded-full bg-orange-500/10 dark:bg-orange-500/5 blur-3xl"></div>
        <div className="absolute bottom-32 right-1/4 w-96 h-96 rounded-full bg-red-500/10 dark:bg-red-500/5 blur-3xl"></div>
      </motion.div>

      {/* Main Content */}
      <div className="relative z-10">
        <div className="flex flex-col bg-gradient-to-b from-white/80 via-white to-white/50 dark:from-[#121212]/80 dark:via-[#121212] dark:to-[#121212]/50 text-black dark:text-white min-h-screen backdrop-blur-sm">
          {/* Header Section with Badge */}
          <div className="border-b border-gray-200/50 dark:border-gray-800/50 p-6 mt-12">
            <div className="max-w-7xl mx-auto flex justify-between items-start">
              <div>
                <div className="inline-block mb-2 px-3 py-1 bg-orange-100/50 dark:bg-orange-900/20 border border-orange-200/50 dark:border-orange-800/50 rounded-full text-sm font-semibold text-orange-700 dark:text-orange-300">
                  Live Contest
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-orange-600 dark:from-orange-400 dark:via-red-400 dark:to-orange-400 bg-clip-text text-transparent">
                  Code Challenge
                </h1>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Times you left:</div>
                <div className="text-4xl font-bold text-orange-600 dark:text-yellow-400 tabular-nums">{leaveCount}</div>
              </div>
            </div>
          </div>

          {/* Main Container - Single Column */}
          <div className="flex flex-col gap-8 p-6 max-w-7xl mx-auto w-full">
            {/* Question Panel */}
            <motion.div 
              className="flex flex-col bg-white/40 dark:bg-gray-900/20 rounded-xl overflow-hidden border border-gray-200/50 dark:border-gray-700/50 min-h-[600px] shadow-lg backdrop-blur-md hover:shadow-xl transition-shadow"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {/* Question Header */}
              <div className="bg-gradient-to-r from-gray-50/50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-900/50 p-6 border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h2 className="text-2xl font-bold">Problem 1: Two Sum</h2>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Classic coding challenge</p>
                  </div>
                  <span className="px-4 py-2 bg-blue-100/80 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg font-semibold text-sm">Easy</span>
                </div>
                <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <span>Acceptance: 85%</span>
                  <span>•</span>
                  <span>Difficulty: ⭐⭐</span>
                </div>
              </div>

              {/* Question Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6 text-gray-800 dark:text-gray-200">
                  <section>
                    <h3 className="text-lg font-bold mb-3 text-gray-900 dark:text-white">Description</h3>
                    <p className="leading-relaxed">
                      Given an array of integers <code className="bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded text-sm">nums</code> and an integer <code className="bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded text-sm">target</code>, return the indices of the two numbers that add up to target. You may assume that each input has exactly one solution, and you cannot use the same element twice. You can return the answer in any order.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-lg font-bold mb-3 text-gray-900 dark:text-white">Constraints</h3>
                    <ul className="list-disc list-inside space-y-2 text-sm">
                      <li>2 ≤ nums.length ≤ 10⁴</li>
                      <li>-10⁹ ≤ nums[i] ≤ 10⁹</li>
                      <li>-10⁹ ≤ target ≤ 10⁹</li>
                      <li>Only one valid answer exists.</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-lg font-bold mb-3 text-gray-900 dark:text-white">Examples</h3>
                    <div className="space-y-4">
                      {[
                        { inp: "nums = [2,7,11,15], target = 9", out: "[0,1]", exp: "nums[0] + nums[1] == 9" },
                        { inp: "nums = [3,2,4], target = 6", out: "[1,2]", exp: "nums[1] + nums[2] == 6" },
                        { inp: "nums = [3,3], target = 6", out: "[0,1]", exp: "nums[0] + nums[1] == 6" },
                      ].map((ex, i) => (
                        <div key={i} className="bg-gray-50/50 dark:bg-gray-800/30 p-4 rounded-lg border border-gray-200/50 dark:border-gray-700/50">
                          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Example {i + 1}</p>
                          <p className="text-sm mb-1"><span className="text-blue-600 dark:text-blue-400 font-semibold">Input:</span> {ex.inp}</p>
                          <p className="text-sm mb-1"><span className="text-green-600 dark:text-green-400 font-semibold">Output:</span> {ex.out}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-500">{ex.exp}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </div>
            </motion.div>

            {/* IDE Panel */}
            <motion.div 
              className="flex flex-col bg-white/40 dark:bg-gray-900/20 rounded-xl overflow-hidden border border-gray-200/50 dark:border-gray-700/50 min-h-[700px] shadow-lg backdrop-blur-md hover:shadow-xl transition-shadow mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {/* IDE Header */}
              <div className="bg-gradient-to-r from-gray-50/50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-900/50 p-4 border-b border-gray-200/50 dark:border-gray-700/50 flex justify-between items-center sticky top-0">
                <h3 className="text-lg font-bold">Code Editor</h3>
                <div className="flex gap-2">
                  <select className="bg-white/50 dark:bg-gray-800/50 text-black dark:text-white border border-gray-300/50 dark:border-gray-600/50 px-3 py-2 rounded-lg text-sm font-medium backdrop-blur-sm">
                    <option>JavaScript</option>
                    <option>Python</option>
                    <option>Java</option>
                    <option>C++</option>
                  </select>
                  <button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 dark:from-blue-700 dark:to-blue-800 dark:hover:from-blue-600 dark:hover:to-blue-700 text-white px-6 py-2 rounded-lg text-sm font-semibold transition-all shadow-md hover:shadow-lg">
                    Run
                  </button>
                  <button className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 dark:from-yellow-600 dark:to-yellow-700 dark:hover:from-yellow-500 dark:hover:to-yellow-600 text-white px-6 py-2 rounded-lg text-sm font-semibold transition-all shadow-md hover:shadow-lg">
                    Submit
                  </button>
                </div>
              </div>

              {/* Code Editor Area */}
              <div className="flex-1 overflow-auto">
                <div className="flex h-full">
                  {/* Line Numbers */}
                  <div className="bg-gray-100/30 dark:bg-gray-900/30 border-r border-gray-200/50 dark:border-gray-700/50 px-4 py-4 text-gray-500 dark:text-gray-600 font-mono text-sm select-none min-w-max">
                    {Array.from({ length: 30 }).map((_, i) => (
                      <div key={i}>{String(i + 1).padStart(2, '0')}</div>
                    ))}
                  </div>
                  {/* Code Area */}
                  <textarea
                    className="flex-1 bg-white/50 dark:bg-[#0f0f0f]/50 text-black dark:text-white p-4 font-mono text-sm resize-none focus:outline-none"
                    defaultValue={`function twoSum(nums, target) {
  // Write your code here
  
}`}
                  />
                </div>
              </div>

              {/* Test Results */}
              <div className="bg-gradient-to-r from-gray-50/50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-900/50 border-t border-gray-200/50 dark:border-gray-700/50 p-4 max-h-48 overflow-y-auto">
                <p className="text-sm font-semibold mb-3 text-gray-900 dark:text-white">Test Results</p>
                <div className="space-y-2 text-sm font-mono">
                  <p className="text-green-600 dark:text-green-400">✓ Test case 1 passed (2ms)</p>
                  <p className="text-green-600 dark:text-green-400">✓ Test case 2 passed (1ms)</p>
                  <p className="text-green-600 dark:text-green-400">✓ Test case 3 passed (1ms)</p>
                  <p className="text-gray-700 dark:text-gray-300 mt-3 font-semibold">All tests passed! ✨</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContestPage;
